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

# Pasos para que el proyecto funcione 
## Antes de empezar tienes que cumplir los siguientes requerimientos
- Tener mysql workbench instalado en la maquina
- Tener Node.js instalado en la maquina
- Ir a exchange-rate-api y conseguir una API Key
- Ir a ChatGpt y conseguir una API Key con tokens 
- Tener una Api Key de JSON Web Token

1. **Ejecutar el siguiente comando en la terminal en la carpeta de BACKEND**
npm install @sendgrid/mail@7.7.0 axios@1.10.0 bcryptjs@2.4.3 cors@2.8.5 dotenv@16.6.1 express@4.21.2 jsonwebtoken@9.0.2 luxon@3.7.1 mysql2@3.14.2 nodemon@3.1.10

2. **Ejecutar el archivo Db.sql en workbench y cambiar las variables de entorno en .env por las de tu base**

3. **Cambiar las variables de entorno en .env por las tuyas**

4. **Cambiar la Api Key en el JS de chatbot.html**

# Y listo tienes tu proyecto listo

# Comandos utilizados

# Clonar repositorio
git clone https://github.com/nfrpoifv/Smartsave.git

# Entrar a carpeta backend e instalar dependencias
cd smartsave-backend
npm install

# Instalar las dependencias 
npm install @sendgrid/mail@7.7.0 axios@1.10.0 bcryptjs@2.4.3 cors@2.8.5 dotenv@16.6.1 express@4.21.2 jsonwebtoken@9.0.2 luxon@3.7.1 mysql2@3.14.2 nodemon@3.1.10

# Iniciar el servidor
node server.js

# diagrama lógico de infraestructura,
[Usuario] ---> [Navegador Web] ---> [Azure VM con Windows Server 2022 + Node.js/Express]
                                  ├── Backend (API REST)
                                  ├── Frontend (HTML, CSS, JS)
                                  └── Base de Datos

# Despliegue de Aplicación en Azure Virtual Machine (Windows Server 2022)

## Descripción
Este proyecto está alojado en una máquina virtual de Azure con Windows Server 2022, donde se hospeda un servidor Node.js/Express.

## Características principales

- **Hospedaje del servidor Node.js/Express:** La aplicación corre directamente en la VM, permitiendo control total del entorno.
- **Control total del entorno y flexibilidad de configuración:** Puedes configurar la máquina y el servidor según tus necesidades específicas.
- **IP Pública de Azure VM:** La máquina tiene una IP pública asignada para facilitar el acceso externo.
- **Permitir acceso externo a la aplicación:** Gracias a la IP pública y la configuración adecuada, la aplicación puede ser accedida desde cualquier ubicación.
- **Acceso desde cualquier ubicación:** Puedes conectarte y usar la aplicación desde cualquier parte del mundo.



