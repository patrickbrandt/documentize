
Reference architecture example:

* Create relational tables for a blog: Article, User, Comment, User2Article
* Reshape relational data into document data for API syndication
* TODO: Index content into ElasticSearch for full-text search

Usage:

* Initialize the relational data structure: ```docker-compose run --rm init```
* Convert to documents: ```docker-compose run --rm documentize```
* Start api: ```docker-compose up api```
  * accessible on the host via the docker host IP address: ```http://localhost:8080/```

These three commands are run in sequence when you execute ```./run.sh```

NOTE: review this issue to avoid problems updating the api service: https://github.com/patrickbrandt/documentizer/issues/3

Dependancies:

* [Docker](https://docs.docker.com/install/#supported-platforms)
* JavaScript skills
* DynamoDB skills

Sample API calls (IP address = default Docker host IP address):

* http://localhost:8080/article/
* http://localhost:8080/article/1
* http://localhost:8080/article/author/4
* http://localhost:8080/article/author/1
