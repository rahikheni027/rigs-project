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

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
