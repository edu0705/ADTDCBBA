import json
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Deportista, Documento, Arma, PrestamoArma

# --- Serializadores Básicos ---

class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = '__all__'
        extra_kwargs = {'file_path': {'required': False}}

class ArmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Arma
        fields = '__all__'
        extra_kwargs = {'file_path': {'required': False}}

class PrestamoArmaSerializer(serializers.ModelSerializer):
    nombre_propietario = serializers.CharField(source='deportista_prestamista.__str__', read_only=True)
    nombre_receptor = serializers.CharField(source='deportista_receptor.__str__', read_only=True)
    info_arma = serializers.CharField(source='arma.__str__', read_only=True)
    nombre_competencia = serializers.CharField(source='competencia.name', read_only=True)
    
    competencia_id = serializers.PrimaryKeyRelatedField(source='competencia', read_only=True)
    arma_id = serializers.PrimaryKeyRelatedField(source='arma', read_only=True)
    arma_marca = serializers.CharField(source='arma.marca', read_only=True)
    arma_modelo = serializers.CharField(source='arma.modelo', read_only=True)
    arma_calibre = serializers.CharField(source='arma.calibre', read_only=True)

    class Meta:
        model = PrestamoArma
        fields = '__all__'
        read_only_fields = ['deportista_prestamista', 'fecha', 'detalles_arma_snapshot']

    def validate(self, data):
        if data.get('arma').deportista == data.get('deportista_receptor'):
            raise serializers.ValidationError("El deportista ya es el dueño de esta arma.")
        return data

class DeportistaSerializer(serializers.ModelSerializer):
    documentos = DocumentoSerializer(many=True, read_only=True)
    armas = ArmaSerializer(many=True, read_only=True)
    prestamos_recibidos = PrestamoArmaSerializer(many=True, read_only=True)
    
    club_info = serializers.CharField(source='club.name', read_only=True) 
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Deportista
        # Incluimos todos los campos (esto traerá es_invitado y departamento_origen automáticamente)
        fields = '__all__'
        extra_kwargs = {
            'foto_path': {'required': False},
            'user': {'read_only': True}
        }

# --- Serializador para Registro (POST) ---
class DeportistaRegistrationSerializer(serializers.ModelSerializer):
    documentos = serializers.CharField(write_only=True, required=False) 
    armas = serializers.CharField(write_only=True, required=False)
    foto_path = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Deportista
        fields = [
            'first_name', 'apellido_paterno', 'apellido_materno',
            'ci', 'birth_date', 'departamento',
            'genero', 'telefono', 'foto_path', 'documentos', 'armas', 
            'club', 'es_historico', 'status',
            # --- NUEVOS CAMPOS AGREGADOS ---
            'es_invitado', 'departamento_origen' 
        ]
        read_only_fields = ['user', 'notas_admin'] 

    def create(self, validated_data):
        request = self.context.get('request')
        
        documentos_json_str = validated_data.pop('documentos', '[]')
        armas_json_str = validated_data.pop('armas', '[]')
        
        if validated_data.get('es_historico', False):
            validated_data['status'] = 'Pendiente de Documentación'

        deportista = Deportista.objects.create(**validated_data)
        
        # Procesar Documentos
        try:
            if documentos_json_str:
                documentos_data = json.loads(documentos_json_str)
                for index, doc_data in enumerate(documentos_data):
                    doc_file = request.FILES.get(f'documentos_file[{index}]')
                    Documento.objects.create(
                        deportista=deportista,
                        document_type=doc_data.get('document_type'),
                        expiration_date=doc_data.get('expiration_date') or None, 
                        file_path=doc_file
                    )
        except (json.JSONDecodeError, TypeError): pass 

        # Procesar Armas
        try:
            if armas_json_str:
                armas_data = json.loads(armas_json_str)
                for index, arma_data in enumerate(armas_data):
                    arma_file = request.FILES.get(f'armas_file[{index}]')
                    Arma.objects.create(
                        deportista=deportista,
                        tipo=arma_data.get('tipo'),
                        calibre=arma_data.get('calibre'),
                        marca=arma_data.get('marca'),
                        modelo=arma_data.get('modelo'),
                        numero_matricula=arma_data.get('numero_matricula'),
                        fecha_inspeccion=arma_data.get('fecha_inspeccion') or None,
                        file_path=arma_file
                    )
        except (json.JSONDecodeError, TypeError): pass

        return deportista