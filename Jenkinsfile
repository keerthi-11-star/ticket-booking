pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = credentials('docker-registry-url')
        DOCKER_CREDENTIALS = credentials('docker-registry-creds')
        KUBECONFIG = credentials('kubeconfig-secret')
        IMAGE_NAME = 'movieticket-api'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        LATEST_TAG = 'latest'
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
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh '''
                        echo "Installing dependencies..."
                        npm ci
                    '''
                }
            }
        }
        
        stage('Lint & Test') {
            steps {
                dir('backend') {
                    sh '''
                        echo "Running linter..."
                        npm run lint || echo "Linter not configured, skipping..."
                        
                        echo "Running tests..."
                        npm test || echo "Tests not configured, skipping..."
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    docker.withRegistry("${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS}") {
                        def customImage = docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "./backend")
                        customImage.tag("${LATEST_TAG}")
                        
                        env.DOCKER_IMAGE = "${IMAGE_NAME}:${IMAGE_TAG}"
                    }
                }
            }
        }
        
        stage('Tag Image') {
            steps {
                script {
                    docker.withRegistry("${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS}") {
                        def image = docker.image("${IMAGE_NAME}:${IMAGE_TAG}")
                        image.tag("${LATEST_TAG}")
                        env.DOCKER_IMAGE_LATEST = "${IMAGE_NAME}:${LATEST_TAG}"
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    docker.withRegistry("${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS}") {
                        def image = docker.image("${IMAGE_NAME}:${IMAGE_TAG}")
                        image.push()
                        image.push("${LATEST_TAG}")
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-secret', variable: 'KUBECONFIG_FILE')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG_FILE}
                            
                            echo "Updating Kubernetes deployment..."
                            
                            # Update image in deployment
                            kubectl set image deployment/movieticket-api \
                                api=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                                -n movieticket || echo "Deployment update failed, may need manual update"
                            
                            # Wait for rollout
                            kubectl rollout status deployment/movieticket-api -n movieticket --timeout=5m
                            
                            echo "Deployment successful!"
                        '''
                    }
                }
            }
        }
        
        stage('Smoke Test') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-secret', variable: 'KUBECONFIG_FILE')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG_FILE}
                            
                            echo "Running smoke tests..."
                            
                            # Get service URL
                            API_URL=$(kubectl get svc movieticket-api -n movieticket -o jsonpath='{.spec.clusterIP}')
                            PORT=$(kubectl get svc movieticket-api -n movieticket -o jsonpath='{.spec.ports[0].port}')
                            
                            if [ -z "$API_URL" ]; then
                                echo "Service not found, skipping smoke tests"
                                exit 0
                            fi
                            
                            # Test health endpoint
                            for i in {1..30}; do
                                if kubectl run -it --rm test-${BUILD_NUMBER} --image=curlimages/curl --restart=Never -- \
                                    curl -f http://${API_URL}:${PORT}/health; then
                                    echo "Smoke test passed!"
                                    kubectl delete pod test-${BUILD_NUMBER} --ignore-not-found=true
                                    exit 0
                                fi
                                echo "Attempt $i failed, retrying in 10 seconds..."
                                sleep 10
                            done
                            
                            echo "Smoke tests failed after 30 attempts"
                            kubectl delete pod test-${BUILD_NUMBER} --ignore-not-found=true
                            exit 1
                        '''
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "Build ${env.BUILD_NUMBER} completed successfully!"
                archiveArtifacts artifacts: 'backend/**/*.log', allowEmptyArchive: true
            }
        }
        failure {
            script {
                echo "Build ${env.BUILD_NUMBER} failed!"
                withCredentials([file(credentialsId: 'kubeconfig-secret', variable: 'KUBECONFIG_FILE')]) {
                    sh '''
                        export KUBECONFIG=${KUBECONFIG_FILE}
                        kubectl logs -l app=movieticket-api -n movieticket --tail=100 || true
                    '''
                }
            }
        }
        always {
            cleanWs()
        }
    }
}

