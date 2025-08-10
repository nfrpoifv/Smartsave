# Smartsave
## Justificación del Enfoque Arquitectónico

Para el desarrollo de este proyecto se optó por una **arquitectura monolítica**.

### Razones de la elección
1. **Tamaño del sistema**
   - El alcance actual del sistema es pequeño a mediano.
   - Las funcionalidades principales (backend, lógica de negocio y frontend) se pueden integrar en una sola base de código sin que la complejidad se vuelva inmanejable.

2. **Patrones de carga**
   - El tráfico esperado en esta fase inicial es moderado, sin picos abruptos que requieran escalado independiente de componentes.
   - Una arquitectura monolítica facilita la implementación y el despliegue en entornos de carga estable.

3. **Necesidades de mantenimiento**
   - Al concentrar todo en un único repositorio, se simplifica la gestión del código, el versionado y el despliegue.
   - Permite a un equipo pequeño mantener el sistema de forma eficiente, reduciendo la sobrecarga de coordinar múltiples servicios.

### Conclusión
Este enfoque ofrece **simplicidad, rapidez de desarrollo y facilidad de mantenimiento** en la etapa actual del proyecto. A futuro, si el sistema crece en complejidad o volumen de usuarios, se evaluará la migración hacia **microservicios** o **arquitecturas serverless** para aprovechar sus beneficios de escalabilidad y flexibilidad.
