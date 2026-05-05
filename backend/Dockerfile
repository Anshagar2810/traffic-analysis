# Use official Python image
FROM python:3.10-slim

# Create a non-root user (Required for Hugging Face Spaces)
RUN useradd -m -u 1000 user

# Set up the user environment
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory inside the user's home
WORKDIR $HOME/app

# Copy requirements and install them
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the backend files to the container
COPY --chown=user . $HOME/app

# Hugging Face Spaces exposes port 7860 by default
ENV PORT=7860

# Command to start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
