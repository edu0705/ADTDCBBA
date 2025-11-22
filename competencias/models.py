from django.db import models
from django.contrib.auth.models import User
import uuid

# --- MODELOS DE CONFIGURACIÓN Y GESTIÓN ---

class Poligono(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    numero_licencia = models.CharField(max_length=50, blank=True, null=True)
    fecha_vencimiento_licencia = models.DateField(blank=True, null=True)
    
    def __str__(self):
        return self.name

class Modalidad(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Categoria(models.Model):
    name = models.CharField(max_length=100)
    modalidad = models.ForeignKey(Modalidad, on_delete=models.CASCADE, related_name='categorias')
    
    # Filtro para mostrar solo armas de cierto calibre en la inscripción
    calibre_permitido = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: '9mm'. Si se define, filtra las armas.")

    def __str__(self):
        return f"{self.modalidad.name} - {self.name}"

class Juez(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='juez_profile')
    full_name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50)

    def __str__(self):
        return self.full_name

class Competencia(models.Model):
    COMPETITION_TYPES = (
        ('Departamental', 'Departamental'),
        ('Nacional', 'Nacional'),
    )
    STATUS_CHOICES = (
        ('Próxima', 'Próxima'),
        ('En Progreso', 'En Progreso'),
        ('Finalizada', 'Finalizada'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    poligono = models.ForeignKey(Poligono, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=50, choices=COMPETITION_TYPES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Próxima')
    
    # Costo Base de Inscripción
    costo_inscripcion_base = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    numero_convocatoria = models.CharField(max_length=20, blank=True, null=True)
    archivo_convocatoria = models.FileField(upload_to='convocatorias/', blank=True, null=True)
    
    # Archivo de Resultados Externos (IPSC WinMSS)
    resultados_pdf = models.FileField(upload_to='resultados_competencias/', blank=True, null=True)
    hora_competencia = models.TimeField(blank=True, null=True)

    # Relaciones M2M
    categorias = models.ManyToManyField(Categoria, through='CategoriaCompetencia', related_name='competencias')
    jueces = models.ManyToManyField(Juez, related_name='competencias')

    def __str__(self):
        return self.name

class CategoriaCompetencia(models.Model):
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    # Costo específico por categoría
    costo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        unique_together = ('competencia', 'categoria')

class Gasto(models.Model):
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE, related_name='gastos')
    descripcion = models.CharField(max_length=200)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    registrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.descripcion}: {self.monto}"


# --- MODELOS DE FLUJO DEPORTIVO ---

class Inscripcion(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente de Revisión/Pago'),
        ('APROBADA', 'Aprobada e Inscrita'),
        ('RECHAZADA', 'Rechazada'),
    ]

    # Usamos string references para evitar ciclos de importación
    deportista = models.ForeignKey('deportistas.Deportista', on_delete=models.CASCADE, related_name='inscripciones')
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE, related_name='inscripciones')
    club = models.ForeignKey('clubs.Club', on_delete=models.CASCADE, related_name='inscripciones')
    
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='PENDIENTE')
    
    # Finanzas
    costo_inscripcion = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    observaciones_pago = models.TextField(blank=True, null=True)
    
    # Organización de Campo
    grupo = models.IntegerField(default=1, help_text="Número de Grupo/Squad")
    carril = models.IntegerField(default=0, help_text="Número de Puesto/Carril")
    
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Inscripción {self.id}"

class Participacion(models.Model):
    inscripcion = models.ForeignKey('Inscripcion', on_delete=models.CASCADE, related_name='participaciones')
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, null=True) 
    modalidad = models.ForeignKey(Modalidad, on_delete=models.CASCADE)
    
    # Referencia a Arma por string
    arma_utilizada = models.ForeignKey('deportistas.Arma', on_delete=models.SET_NULL, null=True, blank=True)
    costo_cobrado = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('inscripcion', 'categoria') 

    def __str__(self):
        return f"Part. {self.categoria}"

class Resultado(models.Model):
    inscripcion = models.ForeignKey('Inscripcion', on_delete=models.CASCADE, related_name='resultados')
    ronda_o_serie = models.CharField(max_length=50) 
    detalles_json = models.JSONField(default=dict)
    puntaje = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    juez_que_registro = models.ForeignKey(Juez, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    # --- DESCALIFICACIÓN (DQ) ---
    es_descalificado = models.BooleanField(default=False)
    motivo_descalificacion = models.CharField(max_length=255, blank=True, null=True)
    # Código único para validar certificados auténticos
    codigo_verificacion = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return f"Result {self.puntaje}"

class Record(models.Model):
    modalidad = models.ForeignKey(Modalidad, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    
    # Referencia string
    deportista = models.ForeignKey('deportistas.Deportista', on_delete=models.CASCADE)
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE)
    
    puntaje = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_registro = models.DateField()
    es_actual = models.BooleanField(default=True)
    antecesor = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"Record {self.puntaje}"

class CompetenciaJuez(models.Model):
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE)
    juez = models.ForeignKey(Juez, on_delete=models.CASCADE)
    class Meta:
        unique_together = ('competencia', 'juez')