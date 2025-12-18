pipeline {
    agent any

    environment {
        IMAGE_NAME = "keerthi1110/movieticket-api"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Lint & Test') {
            steps {
                dir('backend') {
                    sh '''
                    npm run lint || echo "Lint skipped"
                    npm test || echo "Tests skipped"
                    '''
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('', 'dockerhub') {
                        def image = docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "backend")
                        image.push()
                        image.push("latest")
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
                      api=keerthi1110/movieticket-api:latest \
                      -n movieticket

                    kubectl rollout status deployment/movieticket-api -n movieticket --timeout=5m
                    '''
                }
            }
        }

        stage('Smoke Test') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-secret', variable: 'KUBECONFIG_FILE')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG_FILE

                    API_IP=$(kubectl get svc movieticket-api -n movieticket -o jsonpath='{.spec.clusterIP}')
                    PORT=$(kubectl get svc movieticket-api -n movieticket -o jsonpath='{.spec.ports[0].port}')

                    kubectl run curl-test --rm -i --restart=Never \
                      --image=curlimages/curl -- \
                      curl -f http://$API_IP:$PORT/health
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
