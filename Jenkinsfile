pipeline {
    agent any

    environment {
        BACKEND_IMAGE  = "keerthi1110/movieticket-api"
        FRONTEND_IMAGE = "keerthi1110/movieticket-frontend"
        TAG = "${BUILD_NUMBER}"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build & Push Backend Image') {
            steps {
                script {
                    docker.withRegistry('', 'dockerhub') {
                        docker.build("${BACKEND_IMAGE}:${TAG}", "backend").push()
                        docker.image("${BACKEND_IMAGE}:${TAG}").push("latest")
                    }
                }
            }
        }

        stage('Build & Push Frontend Image') {
            steps {
                script {
                    docker.withRegistry('', 'dockerhub') {
                        docker.build("${FRONTEND_IMAGE}:${TAG}", "frontend").push()
                        docker.image("${FRONTEND_IMAGE}:${TAG}").push("latest")
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-secret', variable: 'KUBECONFIG_FILE')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG_FILE

                    kubectl set image deployment/movieticket-api \
                      api=keerthi1110/movieticket-api:latest -n movieticket

                    kubectl set image deployment/movieticket-frontend \
                      frontend=keerthi1110/movieticket-frontend:latest -n movieticket

                    kubectl rollout restart deployment/movieticket-api -n movieticket
                    kubectl rollout restart deployment/movieticket-frontend -n movieticket

                    kubectl rollout status deployment/movieticket-api -n movieticket
                    kubectl rollout status deployment/movieticket-frontend -n movieticket
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
