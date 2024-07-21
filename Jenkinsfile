pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'seynath/ecomclient'
        SCANNER_HOME = '/var/lib/jenkins/tools/hudson.plugins.sonar.SonarRunnerInstallation/sonar-scanner'

    }
//test1
    stages {
        stage('Clone Repository') {
            steps {
                // Clone the repository that contains your Node.js app and Dockerfile
                git branch: 'client', changelog: false, poll: false, url: 'https://github.com/seynath/Ecommerce-all.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                // Use a Node.js Docker container to run npm install
                script {
                    docker.image('node:20-alpine').inside('-u root') {
                        dir('client') {
                            // Check the user running the container
                            sh 'whoami'
                            // Set npm cache to a directory with appropriate permissions
                            sh 'npm config set cache /tmp/.npm'
                            sh 'npm cache clean --force'
                            sh 'npm install'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                // Make sure to cd into the server directory before running the analysis
                dir('client') {
                   withCredentials([string(credentialsId: 'sonar_token', variable: 'SONAR_TOKEN')]) {
                        sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \\
                          -Dsonar.projectKey=ecomclient \\
                          -Dsonar.projectName=ecomclient \\
                          -Dsonar.sources=. \\
                          -Dsonar.host.url=http://35.222.2.63:9000/  \\
                          -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Build Application') {
            steps {
                // Use a Node.js Docker container to build the Vite app
                script {
                    docker.image('node:20-alpine').inside('-u root') {
                        dir('client') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('OWASP SCAN') {
            steps {
                // Make sure to cd into the server directory before running the analysis
                dir('client') {
                   dependencyCheck additionalArguments: '--scan ./ ', odcInstallation: 'DP'
                   dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
                }
            }
        }


        stage('Build Docker Image') {
            steps {
                script {
                    // Retrieve credentials and inject as environment variables
                    withCredentials([
                        string(credentialsId: 'vite_base_url', variable: 'VITE_BASE_URL')
                    ]) {
                        def commitId = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                        dir('client') {
                            sh """
                                docker build --build-arg VITE_BASE_URL=${VITE_BASE_URL} -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                            """
                        }
                    }
                }
            }
        }
        
        
        stage('TRIVY SCAN') {
            steps {
                sh "trivy image ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                
            }
        }
        

        stage('Publish Docker Image') {
            steps {
                // Log in to Docker Hub
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                }
                // Push the image to Docker Hub
                script {
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }

        stage('Trigger CD Pipeline') {
            steps {
                // Trigger another job
                build job: 'client-CD', parameters: [string(name: 'DOCKERTAG', value: env.BUILD_NUMBER)]
            }
        }
    }

    post {
        always {
            // Clean up workspace after build
            cleanWs()
        }
        success {
            // Notify success (e.g., Slack, email, etc.)
            echo 'Deployment successful!'
        }
        failure {
            // Notify failure (e.g., Slack, email, etc.)
            echo 'Deployment failed!'
        }
    }
}
