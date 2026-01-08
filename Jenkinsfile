pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        COMPOSE_FILE_TEST = 'docker-compose.test.yml'
        // Biến môi trường cho FE/BE nếu cần
        REACT_APP_API_URL = 'http://app:3000/api'
        REACT_APP_SOCKET_URL = 'http://51.79.134.45:3005/api'
        REACT_APP_MODE = 'development'
        
       
       
      
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📦 Checking out source code..."
                checkout scmGit(
                    branches: [[name: '*/dev']],
                    extensions: [],
                    userRemoteConfigs: [[
                        credentialsId: 'SSH_FE',
                        url: 'git@github.com:codegym-software/Half-Baked-Devs-KEN-FE.git'
                    ]]
                )
            }
        }

        stage('Clean Docker') {
            steps {
                echo "🧹 Cleaning old Docker containers, images, volumes..."
                bat '''
                    docker compose -f %COMPOSE_FILE% down -v --rmi all --remove-orphans || exit 0
                    docker compose -f %COMPOSE_FILE_TEST% down -v --rmi all --remove-orphans || exit 0
                    docker system prune -f
                '''
            }
        }

        stage('Build & Run Test Environment') {
            steps {
                echo "🐳 Building & running Test Docker environment..."
                bat '''
                    docker compose -f %COMPOSE_FILE_TEST% up -d --build || exit /b 1
                    REM Optional: wait for services healthy
                    timeout /t 10
                    docker compose -f %COMPOSE_FILE_TEST% ps
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo "✅ Running automated tests..."
                bat '''
                    REM Run tests in test container to generate coverage & junit
                    docker compose -f %COMPOSE_FILE_TEST% exec -T react-app-test npm run test:ci || exit /b 1
                '''

                junit allowEmptyResults: true, testResults: 'reports/junit/junit-fe.xml'

                echo "📈 Archiving coverage reports..."
                archiveArtifacts artifacts: 'coverage/**, reports/**', fingerprint: true, allowEmptyArchive: true
            }
        }

        stage('Clean Test Environment') {
            steps {
                echo "🧹 Cleaning Test Docker environment..."
                bat '''
                     echo REACT_APP_API_URL=%REACT_APP_API_URL%
                    echo REACT_APP_SOCKET_URL=%REACT_APP_SOCKET_URL%
                        
                '''
                bat '''
                    docker compose -f %COMPOSE_FILE_TEST% down -v --rmi all --remove-orphans || exit 0
                '''
            }
        }

        stage('Build & Run Production Environment') {
            steps {
                echo "🚀 Building & running Production Docker environment..."
               
                bat '''
                    docker compose -f %COMPOSE_FILE% up -d --build || exit /b 1
                    REM Optional: wait for services healthy
                    timeout /t 10
                    docker compose -f %COMPOSE_FILE% ps
                '''
            }
        }

        stage('Check Status') {
            steps {
                echo "📋 Checking running containers..."
                bat 'docker ps -a'
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline finished successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Cleaning Docker..."
            bat '''
                docker compose -f %COMPOSE_FILE% down -v --rmi all --remove-orphans || exit 0
                docker compose -f %COMPOSE_FILE_TEST% down -v --rmi all --remove-orphans || exit 0
                docker system prune -f
            '''
        }
        always {
            echo "🧾 Pipeline ended."
        }
    }
}
