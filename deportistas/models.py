from django.db import models
from django.contrib.auth.models import User
from clubs.models import Club
import uuid
from datetime import date

class Deportista(models.Model):
    STATUS_CHOICES = (
        ('Pendiente de Aprobación', 'Pendiente de Aprobación'),
        ('Pendiente de Documentación', 'Pendiente de Documentación'),
        ('Activo', 'Activo'),
        ('Suspendido', 'Suspendido'),
        ('Rechazado', 'Rechazado'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    club = models.ForeignKey(Club, on_delete=models.SET_NULL, null=True, blank=True)
    
    first_name = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, null=True, blank=True)
    
    ci = models.CharField(max_length=20, unique=True)
    birth_date = models.DateField()
    departamento = models.CharField(max_length=50)
    genero = models.CharField(max_length=10)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    
    foto_path = models.ImageField(upload_to='fotos_deportistas/', blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pendiente de Aprobación')
    notas_admin = models.TextField(null=True, blank=True) 
    es_historico = models.BooleanField(default=False, help_text="Marcado si es un registro de gestiones pasadas")

    # --- INVITADOS ---
    es_invitado = models.BooleanField(default=False, help_text="Si es True, no suma al ranking local.")
    departamento_origen = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: La Paz (Solo invitados)")

    # --- IDENTIFICACIÓN ÚNICA (CARNET/REAFUC) ---
    codigo_unico = models.CharField(max_length=30, unique=True, blank=True, null=True)

    # --- MENORES DE EDAD ---
    tutor_nombre = models.CharField(max_length=200, blank=True, null=True)
    tutor_telefono = models.CharField(max_length=50, blank=True, null=True)
    archivo_responsabilidad = models.FileField(upload_to='documentos_tutor/', blank=True, null=True)
# --- SEGURIDAD ---
    force_password_change = models.BooleanField(default=True, help_text="Obliga a cambiar la contraseña en el primer login")
    def get_edad(self):
        if not self.birth_date: return 0
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))

    def save(self, *args, **kwargs):
        # Generar código único al activar si no existe
        if self.status == 'Activo' and not self.codigo_unico:
            year = date.today().year
            uid = str(uuid.uuid4())[:4].upper()
            # Formato: ADT-2025-1234-X9Y8
            self.codigo_unico = f"ADT-{year}-{self.ci[:4]}-{uid}"
        super().save(*args, **kwargs)

    def __str__(self):
        materno = self.apellido_materno or ''
        return f"{self.first_name} {self.apellido_paterno} {materno}".strip()

class Documento(models.Model):
    DOCUMENT_TYPES = (
        ('Licencia B', 'Licencia B (PDF)'),
        ('Carnet de Identidad', 'Carnet de Identidad (PDF)'),
        ('Licencia de Competencia', 'Licencia de Competencia'),
        ('Certificado Médico', 'Certificado Médico'),
    )
    deportista = models.ForeignKey('Deportista', on_delete=models.CASCADE, related_name='documentos')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file_path = models.FileField(upload_to='documentos_deportistas/', null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True) 
    
    def __str__(self):
        return f"{self.document_type} - {self.deportista.first_name}"

class Arma(models.Model):
    deportista = models.ForeignKey('Deportista', on_delete=models.CASCADE, related_name='armas')
    tipo = models.CharField(max_length=100)
    calibre = models.CharField(max_length=50)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    numero_matricula = models.CharField(max_length=100)
    fecha_inspeccion = models.DateField(null=True, blank=True)
    file_path = models.FileField(upload_to='matriculas_armas/', null=True, blank=True)
    
    # --- AIRE COMPRIMIDO ---
    es_aire_comprimido = models.BooleanField(default=False, help_text="Si es True, no exige matrícula ni inspección.")

    def __str__(self):
        return f"{self.marca} {self.modelo} ({self.calibre})"

class PrestamoArma(models.Model):
    arma = models.ForeignKey(Arma, on_delete=models.CASCADE, related_name='prestamos')
    deportista_prestamista = models.ForeignKey(Deportista, on_delete=models.CASCADE, related_name='prestamos_realizados', help_text="Dueño del arma")
    deportista_receptor = models.ForeignKey(Deportista, on_delete=models.CASCADE, related_name='prestamos_recibidos', help_text="Quien se presta")
    
    # Referencia string para evitar ciclo
    competencia = models.ForeignKey('competencias.Competencia', on_delete=models.CASCADE)
    
    fecha = models.DateField(auto_now_add=True)
    detalles_arma_snapshot = models.TextField(blank=True, null=True) 
    
    class Meta:
        ordering = ['-fecha']

    def save(self, *args, **kwargs):
        self.detalles_arma_snapshot = f"{self.arma.marca} {self.arma.modelo} ({self.arma.calibre}) - Mat: {self.arma.numero_matricula}"
        self.deportista_prestamista = self.arma.deportista
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Préstamo: {self.arma} a {self.deportista_receptor} ({self.fecha})"

class SolicitudActualizacion(models.Model):
    deportista = models.ForeignKey(Deportista, on_delete=models.CASCADE)
    tipo_dato = models.CharField(max_length=100) # Ej: "Renovación Licencia"
    descripcion = models.TextField()
    archivo_comprobante = models.FileField(upload_to='solicitudes_cambio/')
    estado = models.CharField(max_length=20, default='PENDIENTE') # PENDIENTE, APROBADA, RECHAZADA
    fecha_solicitud = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Solicitud {self.deportista}: {self.tipo_dato}"