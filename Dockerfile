FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /app

# Copy the wrapper and pom.xml first to download dependencies (caches this layer)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

# Copy the rest of the source code and build the application
COPY src src
RUN ./mvnw clean package -DskipTests

# Stage 2: Create the minimal runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar file from the previous stage
COPY --from=build /app/target/rigs-0.0.1-SNAPSHOT.jar app.jar

# Expose the port (Render sets the PORT environment variable natively)
EXPOSE 8080

# Run the jar file, passing Environment Variables explicitly
ENTRYPOINT ["sh", "-c", "java -jar app.jar --spring.datasource.url=${DB_URL} --spring.datasource.username=${DB_USERNAME} --spring.datasource.password=${DB_PASSWORD} --rigs.frontend.url=${FRONTEND_URL:http://localhost:5173} --spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID} --spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}"]
