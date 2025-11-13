from django.db import models
from django.contrib.auth.models import User
from clubs.models import Club

class Deportista(models.Model):
    STATUS_CHOICES = (
        ('Pendiente de Aprobación', 'Pendiente de Aprobación'),
        ('Activo', 'Activo'),
        ('Suspendido', 'Suspendido'),
        ('Rechazado', 'Rechazado'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    club = models.ForeignKey(Club, on_delete=models.SET_NULL, null=True, blank=True)
    
    first_name = models.CharField(max_length=100)
    
    # --- ¡CAMPOS MODIFICADOS! ---
    # last_name = models.CharField(max_length=100) <-- CAMPO ELIMINADO
    apellido_paterno = models.CharField(max_length=100) # <-- CAMPO NUEVO
    apellido_materno = models.CharField(max_length=100, null=True, blank=True) # <-- CAMPO NUEVO (Opcional)
    # --- FIN DE LA MODIFICACIÓN ---
    
    ci = models.CharField(max_length=20, unique=True)
    birth_date = models.DateField()
    departamento = models.CharField(max_length=50)
    genero = models.CharField(max_length=10)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    foto_path = models.ImageField(upload_to='fotos_deportistas/', blank=True, null=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pendiente de Aprobación')
    
    notas_admin = models.TextField(null=True, blank=True) 
    
    # --- ¡FUNCIÓN __str__ MODIFICADA! ---
    def __str__(self):
        # Ahora el nombre completo incluirá ambos apellidos (si el materno existe)
        materno = self.apellido_materno or ''
        return f"{self.first_name} {self.apellido_paterno} {materno}".strip()

class Documento(models.Model):
    # ... (Este modelo no necesita cambios) ...
    DOCUMENT_TYPES = (
        ('Licencia B', 'Licencia B (PDF)'),
        ('Carnet de Identidad', 'Carnet de Identidad (PDF)'),
        ('Licencia de Competencia', 'Licencia de Competencia'),
    )
    deportista = models.ForeignKey('Deportista', on_delete=models.CASCADE, related_name='documentos')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file_path = models.FileField(upload_to='documentos_deportistas/', null=True, blank=True) # (Corrección que hicimos antes)
    expiration_date = models.DateField(null=True, blank=True) 
    
    def __str__(self):
        return f"{self.document_type} - {self.deportista.first_name}"

class Arma(models.Model):
    # ... (Este modelo no necesita cambios) ...
    deportista = models.ForeignKey('Deportista', on_delete=models.CASCADE, related_name='armas')
    tipo = models.CharField(max_length=100)
    calibre = models.CharField(max_length=50)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    numero_matricula = models.CharField(max_length=100)
    fecha_inspeccion = models.DateField(null=True, blank=True)
    file_path = models.FileField(upload_to='matriculas_armas/', null=True, blank=True) # (Corrección que hicimos antes)
    
    def __str__(self):
        return f"{self.marca} {self.modelo} ({self.calibre})"