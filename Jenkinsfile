pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'seynath/ecomserver' // Change 'username' to your Docker Hub username
        // SCANNER_HOME = tool 'sonar-scanner'
        SCANNER_HOME = '/var/lib/jenkins/tools/hudson.plugins.sonar.SonarRunnerInstallation/sonar-scanner'

    }

    stages {
        stage('Clone Repository') {
            steps {
                // Clone the repository that contains your Node.js app and Dockerfile
                git branch: 'server', changelog: false, poll: false, url: 'https://github.com/seynath/Ecommerce-all.git'
            }
        }
        //test1 server

        stage('SonarQube Analysis') {
            steps {
                // Make sure to cd into the server directory before running the analysis
                dir('server') {
                   withCredentials([string(credentialsId: 'sonar_token', variable: 'SONAR_TOKEN')]) {
                        sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \\
                          -Dsonar.projectKey=ecomserver \\
                          -Dsonar.projectName=ecomserver \\
                          -Dsonar.sources=. \\
                          -Dsonar.host.url=http://35.222.2.63:9000/  \\
                          -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('OWASP SCAN') {
            steps {
                // Make sure to cd into the server directory before running the analysis
                dir('server') {
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
                        string(credentialsId: 'mysql_host', variable: 'MYSQL_HOST'),
                        string(credentialsId: 'mysql_user', variable: 'MYSQL_USER'),
                        string(credentialsId: 'mysql_password', variable: 'MYSQL_PASSWORD'),
                        string(credentialsId: 'mysql_db', variable: 'MYSQL_DB'),
                        string(credentialsId: 'jwt_secret', variable: 'JWT_SECRET'),
                        string(credentialsId: 'port', variable: 'PORT'),
                    ]) {
                        def commitId = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                        dir('server') {
                            sh """
                                docker build --build-arg MYSQL_HOST=${MYSQL_HOST} \
                                             --build-arg MYSQL_USER=${MYSQL_USER} \
                                             --build-arg MYSQL_PASSWORD=${MYSQL_PASSWORD} \
                                             --build-arg MYSQL_DB=${MYSQL_DB} \
                                             --build-arg JWT_SECRET=${JWT_SECRET} \
                                             --build-arg PORT=${PORT} \
                                             -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                            """
                        }
                    }
                }
            }
        }

        stage('TRIVY SCAN') {
            steps {
                sh "trivy image seynath/${DOCKER_IMAGE}:${BUILD_NUMBER}"
                
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
                    def commitId = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Trigger CD Pipeline') {
            steps {
                // Trigger another job
                build job: 'server-CD', parameters: [string(name: 'DOCKERTAG', value: env.BUILD_NUMBER)]
            }
        }
    }
}



