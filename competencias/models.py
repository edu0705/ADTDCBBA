from django.db import models
from django.contrib.auth.models import User # <-- ¡IMPORTACIÓN AÑADIDA!
from deportistas.models import Deportista, Arma 
from clubs.models import Club 

# --- Modelos de Gestión ---
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
    
    def __str__(self):
        return f"{self.modalidad.name} - {self.name}"

class Juez(models.Model):
    # ¡CAMPO AÑADIDO (PASO 8)!
    # Conecta el perfil del Juez con una cuenta de Usuario de Django
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
    
    numero_convocatoria = models.CharField(max_length=20, blank=True, null=True)
    archivo_convocatoria = models.FileField(upload_to='convocatorias/', blank=True, null=True)
    hora_competencia = models.TimeField(blank=True, null=True)

    categorias = models.ManyToManyField(Categoria, related_name='competencias')
    jueces = models.ManyToManyField(Juez, related_name='competencias')

    def __str__(self):
        return self.name

# --- Modelos de Flujo ---

class Inscripcion(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente de Revisión/Pago'),
        ('APROBADA', 'Aprobada e Inscrita'),
        ('RECHAZADA', 'Rechazada'),
    ]

    deportista = models.ForeignKey(Deportista, on_delete=models.CASCADE, related_name='inscripciones')
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE, related_name='inscripciones')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='inscripciones')
    
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='PENDIENTE')
    costo_inscripcion = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Inscripción {self.id} de {self.deportista.first_name}"

class Participacion(models.Model):
    inscripcion = models.ForeignKey(
        'Inscripcion', 
        on_delete=models.CASCADE, 
        related_name='participaciones'
    )
    
    modalidad = models.ForeignKey(
        Modalidad, 
        on_delete=models.CASCADE
    )
    
    arma_utilizada = models.ForeignKey(
        Arma, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    class Meta:
        unique_together = ('inscripcion', 'modalidad') 

    def __str__(self):
        return f"Participación en {self.modalidad.name}"

class Resultado(models.Model):
    # CRUCIAL: ForeignKey para múltiples registros de puntaje (por ronda/serie)
    inscripcion = models.ForeignKey(
        'Inscripcion', 
        on_delete=models.CASCADE, 
        related_name='resultados'
    )
    
    ronda_o_serie = models.CharField(max_length=50) 
    
    # Campo para los datos crudos de scoring (ej: {impactos_5: 10, pajaros: 4})
    detalles_json = models.JSONField(default=dict) # <--- ¡CAMPO CRUCIAL!
    
    # El puntaje final calculado por el backend
    puntaje = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    juez_que_registro = models.ForeignKey(Juez, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resultado ({self.ronda_o_serie}) de {self.inscripcion.deportista.first_name}"

# Tablas Pivote (M2M)
class CategoriaCompetencia(models.Model):
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('competencia', 'categoria')

class CompetenciaJuez(models.Model):
    competencia = models.ForeignKey(Competencia, on_delete=models.CASCADE)
    juez = models.ForeignKey(Juez, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('competencia', 'juez')