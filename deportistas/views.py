# deportistas/views.py
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action 
from django.contrib.auth.models import User, Group 
from django.utils.crypto import get_random_string 
from .models import Deportista, Documento, Arma
from .serializers import DeportistaSerializer, DeportistaRegistrationSerializer, DocumentoSerializer, ArmaSerializer


# --- ViewSets para Operaciones CRUD Básicas (GET, PUT, DELETE) ---
class DeportistaViewSet(viewsets.ModelViewSet):
    queryset = Deportista.objects.all() 
    serializer_class = DeportistaSerializer 
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser or user.groups.filter(name__in=['Presidente', 'Tesorero']).exists():
            return Deportista.objects.all()
        
        try:
            if user.groups.filter(name='Club').exists():
                return Deportista.objects.filter(club__user=user)
        except Exception:
            return Deportista.objects.none()
        
        return Deportista.objects.none()


    # ¡ACCIÓN 'APPROVE' MODIFICADA!
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        try:
            deportista = self.get_object()
        except Deportista.DoesNotExist:
            return Response({"detail": "Deportista no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Generar credenciales
        first_name_cleaned = deportista.first_name.split()[0].lower().replace(' ', '')
        desired_username = f"{first_name_cleaned}{deportista.ci[:4]}"
        password = deportista.ci
        
        # --- ¡LÓGICA DE APELLIDO MODIFICADA! ---
        # Creamos el apellido completo para el modelo User
        full_last_name = f"{deportista.apellido_paterno} {deportista.apellido_materno or ''}".strip()
        # --- FIN DE LA MODIFICACIÓN ---

        user = None
        username_to_return = desired_username

        if deportista.user:
            user = deportista.user
            user.set_password(password)
            user.is_active = True
            user.last_name = full_last_name # Actualizamos el apellido en el User
            user.save()
            username_to_return = user.username
        else:
            username = desired_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{desired_username}_{counter}"
                counter += 1
                
            # Creamos el nuevo usuario con el apellido completo
            user = User.objects.create_user(
                username=username,
                password=password,
                first_name=deportista.first_name,
                last_name=full_last_name # <-- Usamos el apellido completo
            )
            username_to_return = username
            deportista.user = user

        # Añadir al grupo "Deportista"
        try:
            deportista_group = Group.objects.get(name='Deportista')
            user.groups.add(deportista_group)
        except Group.DoesNotExist:
            return Response({"detail": "Error crítico: El grupo 'Deportista' no existe en el Admin de Django."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        deportista.status = 'Activo'
        deportista.save()
        
        return Response({
            "message": "Deportista aprobado con éxito.",
            "username": username_to_return,
            "password": password
        }, status=status.HTTP_200_OK)

    # (El resto de tus acciones: suspend, reactivate... están bien)
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        deportista = self.get_object()
        if not deportista.user:
            return Response({"detail": "No se puede suspender a un deportista sin usuario."}, status=status.HTTP_400_BAD_REQUEST)
        
        deportista.status = 'Suspendido'
        deportista.user.is_active = False 
        deportista.save()
        deportista.user.save()
        
        return Response({"message": "Deportista suspendido y cuenta desactivada."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        deportista = self.get_object()
        if not deportista.user:
            return Response({"detail": "Este deportista no tiene cuenta para reactivar."}, status=status.HTTP_400_BAD_REQUEST)

        deportista.status = 'Activo'
        deportista.user.is_active = True
        deportista.save()
        deportista.user.save()

        return Response({"message": "Deportista reactivado."}, status=status.HTTP_200_OK)


# --- Vistas Específicas para Flujo de Registro (POST) ---
class DeportistaRegistrationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = DeportistaRegistrationSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Deportista registrado con éxito. Pendiente de aprobación."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# (ViewSets de Documento y Arma no necesitan cambios)
class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated]

class ArmaViewSet(viewsets.ModelViewSet):
    queryset = Arma.objects.all()
    serializer_class = ArmaSerializer
    permission_classes = [IsAuthenticated]

# (Vista MiPerfilAPIView no necesita cambios, usa el DeportistaSerializer)
class MiPerfilAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            deportista = request.user.deportista 
            serializer = DeportistaSerializer(deportista)
            return Response(serializer.data)
        except Deportista.DoesNotExist:
            return Response({"detail": "No se encontró un perfil de deportista asociado a este usuario."}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            return Response({"detail": "Este usuario no tiene un perfil de deportista."}, status=status.HTTP_400_BAD_REQUEST)