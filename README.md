# Курсовой проект "Форум" по дисциплине СУБД Технопарка Mail.ru
Суть задания заключается в реализации [API](https://tech-db-forum.bozaro.ru/) к базе данных проекта «Форумы» по документации к этому API.

Таким образом, на входе:

 * документация к API;

На выходе:

 * репозиторий, содержащий все необходимое для разворачивания сервиса в Docker-контейнере.

### Запустить проект локально 
Запустить проект
```
npm i
npm start
```

### Запустить проект в docker контейнере
Собрать контейнер
```
docker build -t db_forum 
```
Запустить контейнер 
```
docker run -p 5000:5000 --name forum -t db_forum
```
Остановить контейнер
```
docker stop forum
```
Удалить контейнер 
```
docker rm forum
```

### Скачать программу для запуска тестов  
Скомпилированные программы для тестирования можно скачать по ссылкам:

 * [darwin_amd64.zip](https://bozaro.github.io/tech-db-forum/darwin_amd64.zip)
 * [linux_386.zip](https://bozaro.github.io/tech-db-forum/linux_386.zip)
 * [linux_amd64.zip](https://bozaro.github.io/tech-db-forum/linux_amd64.zip)
 * [windows_386.zip](https://bozaro.github.io/tech-db-forum/windows_386.zip)
 * [windows_amd64.zip](https://bozaro.github.io/tech-db-forum/windows_amd64.zip)

Для локальной сборки Go-скрипта достаточно выполнить команду:
```
go get -u -v github.com/bozaro/tech-db-forum
go build github.com/bozaro/tech-db-forum
```
После этого в текущем каталоге будет создан исполняемый файл `tech-db-forum`.

### Запустить тесты 
Запустить функцональные тесты
```
./tech-db-forum func -u http://localhost:5000/api -r report.html
``` 
Запустить нагрузочные тесты 
```
./tech-db-forum fill -u http://localhost:5000/api
./tech-db-forum perf -u http://localhost:5000/api
```

### Задание: 
Более подробно можно прочитать по следующим ссылкам
- https://github.com/bozaro/tech-db-forum
- https://github.com/bozaro/tech-db-hello

