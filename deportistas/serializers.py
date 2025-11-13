# deportistas/serializers.py

import json # <--- ¡IMPORTANTE!
from rest_framework import serializers
from .models import Deportista, Documento, Arma
from clubs.models import Club
from django.contrib.auth.models import User

# --- Serializadores de Documentos y Armas (Anidados) ---
class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['id', 'document_type', 'expiration_date', 'file_path'] 

class ArmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Arma
        fields = ['id', 'tipo', 'calibre', 'marca', 'modelo', 'numero_matricula', 'fecha_inspeccion', 'file_path']

# --- 1. Serializador Genérico (Para Listado y Detalle) ---
class DeportistaSerializer(serializers.ModelSerializer):
    documentos = DocumentoSerializer(many=True, read_only=True)
    armas = ArmaSerializer(many=True, read_only=True)
    
    club_info = serializers.CharField(source='club.name', read_only=True) 
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Deportista
        # __all__ se asegura de incluir los nuevos campos de apellido
        fields = '__all__'

# --- 2. Serializador de Registro (Para POST) ---
class DeportistaRegistrationSerializer(serializers.ModelSerializer):
    documentos = serializers.CharField(write_only=True) 
    armas = serializers.CharField(write_only=True)
    foto_path = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Deportista
        # --- ¡CAMPOS MODIFICADOS! ---
        # Incluimos los nuevos campos que vienen del formulario de registro.
        fields = [
            'first_name', 'apellido_paterno', 'apellido_materno', # <-- Reemplaza 'last_name'
            'ci', 'birth_date', 'departamento',
            'genero', 'telefono', 'foto_path', 'documentos', 'armas'
        ]
        read_only_fields = ['status', 'club', 'user', 'notas_admin'] 

    # (La lógica 'create' que ya corregimos funciona perfecto, 
    #  porque los nuevos campos 'apellido_paterno' y 'apellido_materno' 
    #  simplemente se pasan con **validated_data)
    def create(self, validated_data):
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("El 'request' no está disponible en el contexto del serializador.")

        documentos_json_str = validated_data.pop('documentos', '[]')
        armas_json_str = validated_data.pop('armas', '[]')
        
        # Aquí se guardan 'first_name', 'apellido_paterno', 'ci', etc.
        deportista = Deportista.objects.create(**validated_data)
        
        try:
            documentos_data = json.loads(documentos_json_str)
            for index, doc_data in enumerate(documentos_data):
                doc_file = request.FILES.get(f'documentos_file[{index}]')
                Documento.objects.create(
                    deportista=deportista,
                    document_type=doc_data.get('document_type'),
                    expiration_date=doc_data.get('expiration_date') or None, 
                    file_path=doc_file
                )
        except json.JSONDecodeError:
            pass 

        try:
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
        except json.JSONDecodeError:
            pass

        return deportista