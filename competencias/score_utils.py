import json

def calculate_round_score(modalidad_name, score_data):
    """
    Calcula el puntaje final unificado para todas las modalidades.
    """
    score_data = score_data or {}
    mod = modalidad_name.upper()

    def get_int(key):
        try: return int(score_data.get(key, 0))
        except: return 0
    
    def get_float(key):
        try: return float(score_data.get(key, 0))
        except: return 0.0

    # --- 1. TIRO AL VUELO / ESCOPETA (Arrays de 1/0) ---
    if any(x in mod for x in ['VUELO', 'ESCOPETA', 'TRAP', 'SKEET', 'HELICE']):
        # Función para sumar los 1s de una lista
        def sumar_lista(key):
            lista = score_data.get(key, [])
            if isinstance(lista, str): # Por si viene como string json
                try: lista = json.loads(lista)
                except: lista = []
            # Sumar solo si es lista y tiene números
            if isinstance(lista, list):
                return sum([1 for x in lista if x == 1])
            return 0

        # Sumar todas las fases posibles
        total = sumar_lista('r1') + sumar_lista('r2') + sumar_lista('semi') + sumar_lista('final')
        
        # Desempate manual (milésima)
        if score_data.get('ganador_desempate'):
            total += 0.001
            
        return float(total)

    # --- 2. TIRO FBI (Penalizaciones) ---
    elif 'FBI' in mod:
        hits = {
            5: get_int('zona_5'), 4: get_int('zona_4'), 3: get_int('zona_3'),
            2: get_int('zona_2'), 1: get_int('zona_1'), 0: get_int('zona_0')
        }
        penalizaciones = get_int('penalizacion_total') 

        # Quitar mejores tiros
        for _ in range(penalizaciones):
            for zona in [5, 4, 3, 2, 1, 0]:
                if hits[zona] > 0:
                    hits[zona] -= 1
                    break 

        total_puntos = (hits[5]*5) + (hits[4]*4) + (hits[3]*3) + (hits[2]*2) + (hits[1]*1)
        
        # Desempate: Puntos > Cant 5s > Menor Tiempo
        score_data['final_hits_5'] = hits[5]
        # El tiempo se guarda tal cual viene del front
        return float(total_puntos)

    # --- 3. PISTOLA MATCH (Lenta/Rápida) ---
    elif 'MATCH' in mod or 'PISTOLA' in mod:
        # Excepción: Pistola Olímpica usa carga simple
        if 'OLIMPICA' in mod or 'OLÍMPICA' in mod:
            base = get_float('puntaje_total_ronda')
            xs = get_int('xs')
            total = base + (xs * 0.001)
            if score_data.get('ganador_desempate'): total += 0.0001
            return float(total)

        total = 0
        for z in range(1, 11):
            total += (get_int(f'lenta_{z}') * z) + (get_int(f'rapida_{z}') * z)
        
        xs = get_int('xs')
        extra = (xs * 0.001)
        if score_data.get('ganador_desempate'): extra += 0.00001
        return total + extra

    # --- 4. SILUETAS (8 Carriles) ---
    elif 'SILUETA' in mod or 'METALICA' in mod:
        c1=get_int('carril_1'); c5=get_int('carril_5')
        c2=get_int('carril_2'); c6=get_int('carril_6')
        c3=get_int('carril_3'); c7=get_int('carril_7')
        c4=get_int('carril_4'); c8=get_int('carril_8')

        total = ((c1+c5)*1) + ((c2+c6)*1.5) + ((c3+c7)*2) + ((c4+c8)*2.5)
        if score_data.get('ganador_desempate'): total += 0.001
        return float(total)
    
    # --- 5. IPSC ---
    elif 'IPSC' in mod or 'PRACTICO' in mod:
        return get_float('match_points')

    # --- 6. LIEBRE Y JABALÍ ---
    elif 'LIEBRE' in mod or 'JABALI' in mod:
        total = 0
        for z in range(1, 6):
            total += (get_int(f'liebre_{z}') * z) + (get_int(f'jabali_{z}') * z)
        
        xs = get_int('xs')
        if score_data.get('ganador_desempate'): xs += 0.01
        return float(total + (xs * 0.001))

    # --- 7. PRECISIÓN SIMPLE (Bench Rest / Carabina) ---
    else:
        base = get_float('puntaje_total_ronda')
        xs = get_int('xs')
        total = base + (xs * 0.001)
        if score_data.get('ganador_desempate'): total += 0.0001
        return float(total)