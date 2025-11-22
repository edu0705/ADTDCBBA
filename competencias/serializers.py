from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import date

from .models import (
    Competencia, Modalidad, Categoria, Poligono, Juez, 
    Inscripcion, Resultado, Participacion, Record, CategoriaCompetencia, Gasto
)
from deportistas.models import Deportista, Arma, PrestamoArma
from clubs.models import Club
from .score_utils import calculate_round_score

class PoligonoSerializer(serializers.ModelSerializer):
    class Meta: model = Poligono; fields = '__all__'
class JuezSerializer(serializers.ModelSerializer):
    class Meta: model = Juez; fields = '__all__'
class CategoriaSerializer(serializers.ModelSerializer):
    class Meta: model = Categoria; fields = '__all__'
class ModalidadSerializer(serializers.ModelSerializer):
    categorias = CategoriaSerializer(many=True, read_only=True)
    class Meta: model = Modalidad; fields = ['id', 'name', 'categorias']
class GastoSerializer(serializers.ModelSerializer):
    class Meta: model = Gasto; fields = '__all__'

class CategoriaCompetenciaSerializer(serializers.ModelSerializer):
    categoria_id = serializers.ReadOnlyField(source='categoria.id')
    categoria_name = serializers.ReadOnlyField(source='categoria.name')
    modalidad_name = serializers.ReadOnlyField(source='categoria.modalidad.name')
    modalidad_id = serializers.ReadOnlyField(source='categoria.modalidad.id')
    # EXPORTAMOS CALIBRE PARA FRONTEND
    calibre_permitido = serializers.ReadOnlyField(source='categoria.calibre_permitido')
    class Meta:
        model = CategoriaCompetencia
        fields = ['id', 'categoria_id', 'categoria_name', 'modalidad_id', 'modalidad_name', 'costo', 'calibre_permitido']

class CompetenciaSerializer(serializers.ModelSerializer):
    lista_precios = CategoriaCompetenciaSerializer(source='categoriacompetencia_set', many=True, read_only=True)
    precios_input = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    categorias = serializers.PrimaryKeyRelatedField(many=True, queryset=Categoria.objects.all(), required=False)
    jueces = serializers.PrimaryKeyRelatedField(many=True, queryset=Juez.objects.all(), required=False)
    class Meta: model = Competencia; fields = '__all__'
    def create(self, validated_data):
        precios = validated_data.pop('precios_input', [])
        cats = validated_data.pop('categorias', [])
        jueces = validated_data.pop('jueces', [])
        comp = Competencia.objects.create(**validated_data)
        comp.jueces.set(jueces)
        for cat in cats:
            p = next((x for x in precios if int(x['id'])==cat.id), None)
            CategoriaCompetencia.objects.create(competencia=comp, categoria=cat, costo=p['costo'] if p else 0)
        return comp

class ParticipacionSerializer(serializers.ModelSerializer):
    modalidad_name = serializers.CharField(source='modalidad.name', read_only=True)
    categoria_name = serializers.CharField(source='categoria.name', read_only=True)
    arma_info = serializers.CharField(source='arma_utilizada.marca', read_only=True)
    arma_calibre = serializers.CharField(source='arma_utilizada.calibre', read_only=True)
    class Meta: model = Participacion; fields = '__all__'

class ParticipacionCreateSerializer(serializers.ModelSerializer):
    categoria_id = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all(), source='categoria')
    class Meta: model = Participacion; fields = ['categoria_id', 'arma_utilizada']

class InscripcionSerializer(serializers.ModelSerializer):
    participaciones = ParticipacionSerializer(many=True, read_only=True) 
    deportista_nombre = serializers.CharField(source='deportista.first_name', read_only=True)
    deportista_apellido = serializers.CharField(source='deportista.apellido_paterno', read_only=True)
    club_nombre = serializers.CharField(source='club.name', read_only=True)
    competencia_nombre = serializers.CharField(source='competencia.name', read_only=True)
    class Meta: model = Inscripcion; fields = '__all__'

# --- VALIDACIÓN INTELIGENTE ---
class InscripcionCreateSerializer(serializers.ModelSerializer):
    participaciones = ParticipacionCreateSerializer(many=True, write_only=True)
    class Meta: model = Inscripcion; fields = ['deportista', 'competencia', 'participaciones'] 

    def validate(self, data):
        competencia = data.get('competencia')
        participaciones = data.get('participaciones', [])
        deportista = data.get('deportista')
        today = date.today()
        edad = deportista.get_edad()

        # 1. Estado de Licencia (Solo para fuego)
        licencia_b = deportista.documentos.filter(document_type='Licencia B').order_by('-expiration_date').first()
        tiene_licencia = licencia_b and (not licencia_b.expiration_date or licencia_b.expiration_date >= today)

        for part in participaciones:
            arma = part.get('arma_utilizada')
            cat_obj = part.get('categoria')

            if arma:
                # A. FILTRO CALIBRE
                if cat_obj.calibre_permitido and arma.calibre.lower().strip() != cat_obj.calibre_permitido.lower().strip():
                     raise serializers.ValidationError(f"Categoría '{cat_obj.name}' exige calibre {cat_obj.calibre_permitido}, pero el arma es {arma.calibre}.")

                # B. REGLAS ARMA FUEGO (No Aire)
                if not arma.es_aire_comprimido:
                    # Menor de edad
                    if edad < 21:
                        if not deportista.archivo_responsabilidad:
                            raise serializers.ValidationError(f"Menor ({edad} años) requiere 'Carta de Responsabilidad de Tutor' para usar fuego.")
                    else:
                        # Mayor sin licencia
                        if not tiene_licencia:
                            raise serializers.ValidationError(f"Mayor de edad sin Licencia B vigente. Solo puede usar Aire Comprimido.")

                    # Inspección (2026+)
                    if competencia.start_date.year >= 2026:
                        if not arma.fecha_inspeccion or arma.fecha_inspeccion < competencia.start_date:
                            raise serializers.ValidationError(f"El arma {arma.marca} tiene la inspección vencida.")

                # C. PROPIEDAD
                if arma.deportista != deportista:
                    if not PrestamoArma.objects.filter(arma=arma, deportista_receptor=deportista, competencia=competencia).exists():
                        raise serializers.ValidationError(f"Arma {arma.marca} no es propia ni prestada legalmente.")

            # D. OBLIGATORIO 2026
            elif competencia.start_date.year >= 2026:
                 raise serializers.ValidationError("2026+: Arma obligatoria.")
        return data

    @transaction.atomic
    def create(self, validated_data):
        participaciones_data = validated_data.pop('participaciones')
        competencia = validated_data['competencia']
        request = self.context.get('request')
        total_a_pagar = competencia.costo_inscripcion_base
        
        if hasattr(request.user, 'club'): validated_data['club'] = request.user.club
        elif hasattr(request.user, 'deportista') and request.user.deportista.club: validated_data['club'] = request.user.deportista.club

        inscripcion, created = Inscripcion.objects.get_or_create(
            competencia=competencia, deportista=validated_data['deportista'],
            defaults={'club': validated_data.get('club'), 'costo_inscripcion': 0}
        )
        if not created: total_a_pagar = inscripcion.costo_inscripcion

        for p_data in participaciones_data:
            cat_obj = p_data['categoria']
            if Participacion.objects.filter(inscripcion=inscripcion, categoria=cat_obj).exists(): continue
            try: costo_cat = CategoriaCompetencia.objects.get(competencia=competencia, categoria=cat_obj).costo
            except: costo_cat = 0
            total_a_pagar += costo_cat

            Participacion.objects.create(
                inscripcion=inscripcion, categoria=cat_obj, modalidad=cat_obj.modalidad,
                arma_utilizada=p_data.get('arma_utilizada'), costo_cobrado=costo_cat
            )
        
        inscripcion.costo_inscripcion = total_a_pagar
        inscripcion.save()
        return inscripcion

class ResultadoSerializer(serializers.ModelSerializer):
    class Meta: model = Resultado; fields = '__all__'

class ScoreSubmissionSerializer(serializers.ModelSerializer):
    inscripcion = serializers.PrimaryKeyRelatedField(queryset=Inscripcion.objects.all())
    puntaje_crudo = serializers.JSONField(write_only=True) 
    ronda_o_serie = serializers.CharField(max_length=50) 
    class Meta: model = Resultado; fields = ['inscripcion', 'ronda_o_serie', 'puntaje_crudo'] 
    
    def validate(self, data):
        if data.get('inscripcion').competencia.status == 'Finalizada': raise serializers.ValidationError("Competencia cerrada.")
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        juez = None
        if request and hasattr(request, 'user') and not request.user.is_anonymous:
            try: juez = request.user.juez_profile
            except: pass 
        
        inscripcion = validated_data.get('inscripcion')
        score_data = validated_data.pop('puntaje_crudo')
        ronda = validated_data.get('ronda_o_serie')
        participacion = inscripcion.participaciones.first() 
        if not participacion: raise serializers.ValidationError("Sin participación.")
             
        final_score = calculate_round_score(participacion.modalidad.name, score_data)
        
        resultado = Resultado.objects.create(
            inscripcion=inscripcion, puntaje=final_score, detalles_json=score_data,
            ronda_o_serie=ronda, juez_que_registro=juez
        )
        
        # Récords
        comp = inscripcion.competencia
        cats = comp.categorias.filter(modalidad=participacion.modalidad)
        for cat in cats:
            rec_actual = Record.objects.filter(modalidad=participacion.modalidad, categoria=cat, es_actual=True).first()
            nuevo = False
            if rec_actual:
                if final_score > rec_actual.puntaje:
                    rec_actual.es_actual = False; rec_actual.save(); nuevo = True
            else: nuevo = True
            if nuevo:
                Record.objects.create(
                    modalidad=participacion.modalidad, categoria=cat, deportista=inscripcion.deportista,
                    competencia=comp, puntaje=final_score, fecha_registro=comp.start_date, es_actual=True, antecesor=rec_actual
                )
        
        # WebSockets
        cl = get_channel_layer()
        dep_name = f"{inscripcion.deportista.first_name} {inscripcion.deportista.apellido_paterno}"
        arma = f"{participacion.arma_utilizada.marca}" if participacion.arma_utilizada else "N/A"
        async_to_sync(cl.group_send)(
            f'competencia_{comp.id}',
            {'type': 'resultado_update', 'data': {'inscripcion_id': inscripcion.id, 'puntaje': str(final_score), 'deportista': dep_name, 'arma': arma}}
        )
        return resultado