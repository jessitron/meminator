# Use a base image with necessary tools (e.g., Bash)
FROM alpine:latest

# Install Bash and Curl
RUN apk update && \
    apk add --no-cache bash curl

# Set working directory
WORKDIR /app

# Copy the script into the container
COPY loadgen.sh .

# Make the script executable (if needed)
RUN chmod +x loadgen.sh

# Specify the command to run the script
CMD ["./loadgen.sh"]
