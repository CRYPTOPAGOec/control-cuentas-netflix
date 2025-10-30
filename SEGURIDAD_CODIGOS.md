# 🔒 Mejoras de Seguridad en Códigos de Acceso

## Cambios Implementados

### Antes (v1.0):
- **Longitud**: 8 caracteres
- **Caracteres**: Solo MAYÚSCULAS y números (A-Z, 2-9)
- **Entropía**: ~33 caracteres = 5.04 bits por carácter
- **Total bits**: ~40 bits (8 × 5.04)
- **Combinaciones**: ~1.1 billones (33^8)

### Ahora (v2.0):
- **Longitud**: 13 caracteres (12 alfanuméricos + 1 especial)
- **Caracteres**: Mayúsculas, minúsculas, números y especiales (A-Z, a-z, 2-9, @#$%&*)
- **Entropía**: ~60 caracteres = 5.91 bits por carácter
- **Total bits**: ~77 bits (13 × 5.91)
- **Combinaciones**: ~9.2 × 10^22 (muchísimo más seguro)

## Características de Seguridad

✅ **Crypto-Random**: Usa `crypto.getRandomValues()` en lugar de `Math.random()`
✅ **Case-Sensitive**: Distingue entre mayúsculas y minúsculas
✅ **Caracteres Especiales**: Incluye símbolos (@#$%&*) en posición aleatoria
✅ **Mayor Longitud**: 13 caracteres vs 8 anteriores
✅ **Sin Confusión**: Excluye I/l/1, O/0 para evitar errores de lectura

## Comparación de Seguridad

### Ataques de Fuerza Bruta:
- **v1.0 (8 chars)**: ~1.1 billones de intentos
  - A 1 millón de intentos/seg: ~12 días
  
- **v2.0 (13 chars)**: ~9.2 × 10^22 intentos
  - A 1 millón de intentos/seg: ~2,900 millones de años

### Resistencia:
- **Rainbow Tables**: Inefectivas por alta entropía y caracteres especiales
- **Diccionario**: Imposible, no son palabras
- **Patrones**: Aleatorio criptográfico, sin patrones detectables

## Ejemplo de Códigos

### v1.0 (8 caracteres):
```
A7K9M2X5
3B8R4H6N
Z2Y5T8W3
```

### v2.0 (13 caracteres):
```
aB7r@m9XtK4p2
R5h&k8Zn3qWe9j
m3T#4vBx7Y2nL9
```

## Instrucciones de Actualización

1. **Ejecutar script SQL**:
   ```bash
   # En Supabase SQL Editor, ejecuta:
   update_codes_security.sql
   ```

2. **Recargar páginas**:
   - admin.html (Ctrl+Shift+R)
   - login.html (Ctrl+Shift+R)

3. **Compatibilidad**:
   - Los códigos antiguos de 8 caracteres siguen funcionando
   - Solo nuevos códigos tendrán 13 caracteres

## Recomendaciones Adicionales

1. **Límite de Intentos**: Implementar rate limiting en login (ej: 5 intentos/hora)
2. **IP Blocking**: Bloquear IPs después de múltiples fallos
3. **Notificaciones**: Alertar al admin si hay intentos sospechosos
4. **Rotación**: Cambiar códigos periódicamente (ej: cada 90 días)
5. **2FA**: Considerar agregar segundo factor para admins

## Notas de Implementación

- Los códigos son **case-sensitive** (distinguen mayúsculas/minúsculas)
- El usuario debe ingresar el código exactamente como se generó
- Se recomienda copiar/pegar en lugar de escribir manualmente
- El botón "Copiar código" facilita esto en la interfaz admin

---

**Última actualización**: Octubre 2025
**Versión**: 2.0 - Seguridad Mejorada
