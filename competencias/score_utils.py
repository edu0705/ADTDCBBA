# competencias/score_utils.py
import json

def calculate_round_score(modalidad_name, score_data):
    """
    Calcula el puntaje final de una ronda/serie basado en la modalidad y los datos crudos.
    score_data es un diccionario de los impactos crudos (ej: {'pajaros': 4, 'impactos_5': 10}).
    
    El puntaje es siempre devuelto como un flotante (float) para manejar los decimales.
    """
    score_data = score_data or {}
    
    # Convierte a mayúsculas para un chequeo de modalidad sin errores
    modalidad_name = modalidad_name.upper()

    # Función auxiliar para obtener float de manera segura
    def get_float(key):
        return float(score_data.get(key, 0) or 0)

    # --- 1. SILUETA METÁLICA .22 RL (Factores de Multiplicación) ---
    if 'SILUETA METÁLICA' in modalidad_name:
        pajaros = get_float('pajaros')
        chanchos = get_float('chanchos')
        pavas = get_float('pavas')
        carneros = get_float('carneros')
        
        return (pajaros * 1.0) + \
               (chanchos * 1.5) + \
               (pavas * 2.0) + \
               (carneros * 2.5)

    # --- 2. FBI (Puntos por Impacto y Desglose: 5, 4, 3, 2) ---
    elif 'FBI' in modalidad_name:
        impactos_5 = get_float('impactos_5')
        impactos_4 = get_float('impactos_4')
        impactos_3 = get_float('impactos_3')
        impactos_2 = get_float('impactos_2')
        
        # El cálculo es la suma de los puntos obtenidos por cada impacto
        return (impactos_5 * 5) + \
               (impactos_4 * 4) + \
               (impactos_3 * 3) + \
               (impactos_2 * 2)

    # --- 3. ESCOPETA / HUNTER (Suma Directa o Total de Impactos) ---
    # Aplica para Fosa Olímpica, Hunter, etc.
    elif 'ESCOPETA' in modalidad_name or 'HUNTER' in modalidad_name:
        # Asume que el frontend envía el total sumado de la ronda como 'total_impactos'
        return get_float('total_impactos')

    # --- 4. CHANCHO Y LIEBRE (Impactos Liebre/Jabalí) ---
    elif 'CHANCHO Y LIEBRE' in modalidad_name:
        # Suma de impactos en liebres y jabalíes
        liebres = get_float('impactos_liebre')
        jabalies = get_float('impactos_jabali')
        return liebres + jabalies
    
    # --- 5. ¡NUEVA LÓGICA! BENCH REST (Puntuación + X's) ---
    elif 'BENCH REST' in modalidad_name:
        # El puntaje principal es 'puntuacion'. 
        # 'cantidad_x' se guarda automáticamente en detalles_json.
        return get_float('puntuacion')
        
    # --- 6. Por Defecto (Suma de Puntuación Principal) ---
    else:
        # Usamos un campo genérico para el total de la ronda
        return get_float('puntaje_total_ronda')