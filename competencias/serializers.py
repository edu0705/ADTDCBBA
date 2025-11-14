from rest_framework import serializers
from .models import (
    Competencia, Modalidad, Categoria, Poligono, Juez, 
    Inscripcion, Resultado, Participacion
)
from deportistas.models import Deportista, Arma
from clubs.models import Club
from django.contrib.auth.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .score_utils import calculate_round_score # <-- ¡IMPORTANTE!

from django.db import transaction # <-- 1. AÑADE ESTA IMPORTACIÓN

# --- Serializadores de Gestión ---
class PoligonoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poligono
        fields = '__all__'

class JuezSerializer(serializers.ModelSerializer):
    class Meta:
        model = Juez
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ModalidadSerializer(serializers.ModelSerializer):
    categorias = CategoriaSerializer(many=True, read_only=True)
    class Meta:
        model = Modalidad
        fields = ['id', 'name', 'categorias']

class CompetenciaSerializer(serializers.ModelSerializer):
    categorias = serializers.PrimaryKeyRelatedField(many=True, queryset=Categoria.objects.all())
    jueces = serializers.PrimaryKeyRelatedField(many=True, queryset=Juez.objects.all())
    
    class Meta:
        model = Competencia
        fields = '__all__'


# --- Serializadores de Inscripción y Participación ---

class ParticipacionSerializer(serializers.ModelSerializer):
    modalidad_name = serializers.CharField(source='modalidad.name', read_only=True)
    arma_info = serializers.CharField(source='arma_utilizada.marca', read_only=True) 

    class Meta:
        model = Participacion
        fields = ['id', 'modalidad', 'modalidad_name', 'arma_utilizada', 'arma_info']

class ParticipacionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participacion
        fields = ['modalidad', 'arma_utilizada']

# Serializador principal para crear la Inscripción (recibe datos anidados)
class InscripcionCreateSerializer(serializers.ModelSerializer):
    participaciones = ParticipacionCreateSerializer(many=True, write_only=True)
    
    class Meta:
        model = Inscripcion
        fields = ['deportista', 'competencia', 'participaciones'] 

    @transaction.atomic  # <-- 2. AÑADE ESTE DECORADOR
    def create(self, validated_data):
        participaciones_data = validated_data.pop('participaciones')
        
        # Asume que el usuario logueado es el dueño del club
        # ¡MEJORA DE SEGURIDAD! Obtener el club desde el usuario
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or not hasattr(request.user, 'club'):
             raise serializers.ValidationError({"detail": "No se puede identificar el club del usuario logueado."})

        validated_data['club'] = request.user.club
        
        # --- INICIO DE LA TRANSACCIÓN ---
        inscripcion = Inscripcion.objects.create(**validated_data)
        
        for participacion_data in participaciones_data:
            Participacion.objects.create(inscripcion=inscripcion, **participacion_data)
        # --- FIN DE LA TRANSACCIÓN ---
        # Si algo falla aquí adentro, Django revierte la creación de 'inscripcion'.
            
        return inscripcion

# Serializador de Inscripción para LISTAR
class InscripcionSerializer(serializers.ModelSerializer):
    participaciones = ParticipacionSerializer(many=True, read_only=True) 
    deportista = serializers.StringRelatedField()
    
    class Meta:
        model = Inscripcion
        fields = '__all__'


# --- Serializadores de Resultados y Live Scoring ---

class ResultadoSerializer(serializers.ModelSerializer):
    # Serializador genérico para listar los resultados
    class Meta:
        model = Resultado
        fields = '__all__'

class ScoreSubmissionSerializer(serializers.ModelSerializer):
    # Recibimos el objeto JSON de datos crudos (ej: {pajaros: 4, chanchos: 5})
    inscripcion = serializers.PrimaryKeyRelatedField(
        queryset=Inscripcion.objects.all()
    )
    puntaje_crudo = serializers.JSONField(write_only=True) # Campo para los datos crudos
    ronda_o_serie = serializers.CharField(max_length=50) 
    
    class Meta:
        model = Resultado
        # Solo recibimos la Inscripcion, Ronda, y los Datos Crudos
        fields = ['inscripcion', 'ronda_o_serie', 'puntaje_crudo'] 
    
    # ¡MÉTODO CREATE MODIFICADO! (Paso 8.D)
    def create(self, validated_data):
        
        # 1. Obtenemos el usuario logueado desde el 'context'
        request = self.context.get('request')
        juez_logueado = None
        
        if request and hasattr(request, 'user') and not request.user.is_anonymous:
            # Buscamos el perfil de Juez asociado a este Usuario
            try:
                # 'juez_profile' es el 'related_name' que definimos en el Modelo Juez
                juez_logueado = request.user.juez_profile
            except Juez.DoesNotExist:
                pass # El usuario logueado no tiene un perfil de Juez
        
        
        # 2. Tu lógica existente para calcular el score (¡ESTÁ PERFECTA!)
        inscripcion_obj = validated_data.get('inscripcion')
        score_data = validated_data.pop('puntaje_crudo')
        
        participacion = inscripcion_obj.participaciones.first() 
        
        if not participacion:
             raise serializers.ValidationError({"detail": "La inscripción no tiene una participación válida para calcular el score."})
             
        modalidad_name = participacion.modalidad.name
        
        # 2. CALCULAR EL PUNTAJE FINAL usando la función de utilidad
        final_score = calculate_round_score(modalidad_name, score_data)
        
        # 3. CREAR EL REGISTRO DE RESULTADO
        resultado = Resultado.objects.create(
            inscripcion=inscripcion_obj,
            puntaje=final_score, # <-- Usamos el valor CALCULADO
            detalles_json=score_data, # Guardamos el detalle crudo para auditoría
            ronda_o_serie=validated_data.get('ronda_o_serie'),
            juez_que_registro=juez_logueado # <-- ¡AQUÍ GUARDAMOS AL JUEZ!
        )
        
        # 4. Lógica de WebSockets (Broadcast)
        channel_layer = get_channel_layer()
        competencia_id = inscripcion_obj.competencia.id
        competencia_group_name = f'competencia_{competencia_id}'

        deportista_name = f"{inscripcion_obj.deportista.first_name} {inscripcion_obj.deportista.last_name}"
        
        participacion = inscripcion_obj.participaciones.first()
        arma_info = "N/A"
        if participacion and participacion.arma_utilizada:
            arma_info = f"{participacion.arma_utilizada.marca} {participacion.arma_utilizada.calibre}"

        async_to_sync(channel_layer.group_send)(
            competencia_group_name,
            {
                'type': 'resultado_update', 
                'data': {
                    'inscripcion_id': inscripcion_obj.id,
                    'competencia_id': competencia_id,
                    'puntaje': str(final_score), # Convertir el puntaje CALCULADO a string para JSON
                    'deportista': deportista_name,
                    'arma': arma_info,
                    'ronda': validated_data.get('ronda_o_serie')
                }
            }
        )
        return resultado