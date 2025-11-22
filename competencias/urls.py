# competencias/urls.py
from rest_framework.routers import DefaultRouter
from .views import GastoViewSet
from django.urls import path, include
from .views import (
    CompetenciaViewSet, 
    ModalidadViewSet, 
    CategoriaViewSet, 
    PoligonoViewSet, 
    JuezViewSet,
    InscripcionViewSet,
    ResultadoViewSet,
    ScoreSubmissionAPIView, 
    InscripcionCreateAPIView,
    AnnualRankingView,
    DepartmentalRecordsView,
    ClubRankingView 
)

router = DefaultRouter()
router.register(r'competencias', CompetenciaViewSet)
router.register(r'modalidades', ModalidadViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'poligonos', PoligonoViewSet)
router.register(r'jueces', JuezViewSet)
router.register(r'inscripciones', InscripcionViewSet)
router.register(r'resultados', ResultadoViewSet) 
router.register(r'gastos', GastoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    path('inscripcion/create/', InscripcionCreateAPIView.as_view(), name='inscripcion-create'),
    path('score/submit/', ScoreSubmissionAPIView.as_view(), name='score-submission'),
    
    path('ranking/anual/', AnnualRankingView.as_view(), name='annual-ranking'),
    path('ranking/clubes/', ClubRankingView.as_view(), name='club-ranking'),
    path('records/', DepartmentalRecordsView.as_view(), name='departmental-records'), # <-- NUEVA RUTA
]