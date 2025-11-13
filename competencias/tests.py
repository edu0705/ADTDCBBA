# competencias/tests.py
from django.test import TestCase
from .score_utils import calculate_round_score # Importamos la función que queremos probar

class ScoreUtilsTestCase(TestCase):
    
    def test_calculate_silueta_metalica(self):
        """
        Prueba el cálculo de puntaje para Silueta Metálica.
        Factores: pajaro=1, chancho=1.5, pava=2, carnero=2.5
        """
        self.stdout.write("Ejecutando prueba: Silueta Metálica\n")
        modalidad = "SILUETA METÁLICA .22"
        # 10 pajaros (10*1) + 10 chanchos (10*1.5) + 10 pavas (10*2) + 10 carneros (10*2.5) = 10 + 15 + 20 + 25 = 70
        score_data = {
            'pajaros': 10,
            'chanchos': 10,
            'pavas': 10,
            'carneros': 10
        }
        resultado = calculate_round_score(modalidad, score_data)
        # Comprobamos que el resultado sea exactamente 70.0
        self.assertEqual(resultado, 70.0)

    def test_calculate_fbi(self):
        """
        Prueba el cálculo de puntaje para FBI.
        Factores: 5, 4, 3, 2
        """
        self.stdout.write("Ejecutando prueba: FBI\n")
        modalidad = "FBI 9MM"
        # 5 impactos de 5 (5*5) + 2 impactos de 4 (2*4) + 1 impacto de 3 (1*3) = 25 + 8 + 3 = 36
        score_data = {
            'impactos_5': 5,
            'impactos_4': 2,
            'impactos_3': 1,
            'impactos_2': 0 # Probar un valor 0
        }
        resultado = calculate_round_score(modalidad, score_data)
        self.assertEqual(resultado, 36.0)

    def test_calculate_default_puntaje_total(self):
        """
        Prueba la lógica por defecto (Hunter, Escopeta, Bench Rest).
        Debe devolver el 'puntaje_total_ronda' directamente.
        """
        self.stdout.write("Ejecutando prueba: Puntaje Total (Escopeta)\n")
        modalidad = "ESCOPETA FOSA"
        score_data = { 'puntaje_total_ronda': 24.0 }
        resultado = calculate_round_score(modalidad, score_data)
        self.assertEqual(resultado, 24.0)

    def test_calculate_empty_data(self):
        """
        Prueba que si no se envían datos (None o {}), el puntaje es 0.
        """
        self.stdout.write("Ejecutando prueba: Datos Vacíos\n")
        modalidad = "FBI 9MM"
        score_data_vacia = {}
        score_data_none = None # Tu función maneja esto
        
        resultado_vacio = calculate_round_score(modalidad, score_data_vacia)
        resultado_none = calculate_round_score(modalidad, score_data_none)
        
        self.assertEqual(resultado_vacio, 0.0)
        self.assertEqual(resultado_none, 0.0)