#specify the base image
FROM python:3:10-slim

#set the working directory inside the container
WORKDIR /app

#copy requirements.txt to the container
COPY requirements.txt

#install dependencies
RUN pip install --no-cache-dir -r requirements.txt

#copy the rese of the application code
COPY . . 

# expose the app's running port
EXPOSE 8000

#define the command to run the app
CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port" "8000" ]