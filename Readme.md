 ytClone App Backend

This is learning project for backend development.

## Table of Contents

---
# Summary of this project
- [Description](#description)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Tests](#tests)
- [License](#license)
- [Questions](#questions)

This project is a complex backend project that is built with nodejs, expressjs, mongodb, mongoose, jwt, bcrypt, and many more. This project is a complete backend project that has all the features that a backend project should have.
We are building a complete video hosting website similar to youtube with all the features like login, signup, upload video, like, dislike, comment, reply, subscribe, unsubscribe, and many more.
## Description
This project is a robust backend built with NodeJs, ExpressJS and MongoDB, designed to handle a variety of operations for a social media-like platform. It includes user controllers that manage registration, login, logout, and other user-related functionalities. The video controller allows users to perform CRUD operations on videos. Similarly, users can create, read, update, and delete comments and community post. The like controller enables users to like videos, comments, and community, enhancing user interaction and engagement. Additionally, a dashboard controller provides an overview of user activities and interactions. This backend serves as a solid foundation for a future frontend, paving the way for a full-stack social media application.

Project uses all standard practices like JWT, bcrypt, access tokens, refresh Tokens and many more. We have spent a lot of time in building this project and we are sure that you will learn a lot from this project.
## Prerequisites

---
Top Contributer to complete all TODOs
Before you begin, ensure you have met the following requirements:

1. Spiderman (just sample)  [Link to Repo](https://www.youtube.com/@chaiaurcode)
- You have installed the latest version of Node.js and npm.
- You have a Windows/Linux/Mac machine.
- You have read guide to Express.js.
- You have a basic understanding of JavaScript and MongoDB.
- You have MongoDB installed or have a MongoDB Atlas account.

--- 
## How to contribute in this open source Project

First, please understand that this is not your regular project to merge your PR. This repo requires you to finish all assignments that are in controller folder. We don't accept half work, please finish all controllers and then reach us out on [Discord](https://hitesh.ai/discord) or [Twitter](https://twitter.com/@hiteshdotcom) and after checking your repo, I will add link to your repo in this readme.
## Installation


Follow these steps to get the project set up on your local machine:

1. **Clone the repository**: First, you will need to clone the repository to your local machine. You can do this with the following command:

    ```bash
    git clone https://github.com/jpayansh/ytClone.git
    ```

2. **Navigate to the project directory**: Change your current directory to the project's directory:

    ```bash
    cd Vidtube
    ```

3. **Install the dependencies**: Now, you can install the necessary dependencies for the project:

    ```bash
    npm install
    npm install -g nodemon
    npm install dotenv cloudinary mongoose mongoose-aggregate-paginate-v2 bcrypt jsonwebtoken express cors cookie-parser cloudinary multer

    ```

4. **Set up environment variables**: Copy the `.env.example` file and rename it to `.env`. Then, fill in the necessary environment variables.

5. **Start the server**: Finally, you can start the server:

    ```bash
    npm run dev
    ```

Now, you should be able to access the application at `http://localhost:8000` (or whatever port you specified).


## Usage

This project is a backend application, so you'll interact with it using API endpoints. Here are some examples:

**User Registration**

To register a new user, send a POST request to `/api/v1/users/register` with the following data:

```json
{
  "username": "example",
  "email": "example@email.com",
  "password": "examplepassword",
  "fullName": "Example User",
  "avatar": "avatar.jpg",
  "coverImage": "coverImage.jpg",
}


```

**User Login**

To login, send a POST request to `/api/v1/users/login` with the following data:

```json
{
  "email": "example@email",
  "password": "examplepassword"
}
```

**User Logout**

To logout, send a POST request to `/api/v1/users/logout` .

There a lot of endpoint you can see in routes.




## Contributing
This project is open source and it is based on learning, this project is from "Chai-aur-code" yt channel.

## Tests
This project uses Postman for testing its API endpoints. 
here is a postman collection import in your postman collection and set the environment variables.
variable : vidtube  initialValue : http://localhost:8000/api/v1/  currentValue : http://localhost:8000/api/v1/

The tests cover the following areas:

- User registration, login, and logout
- Video CRUD operations
- Comment CRUD operations
- Community CRUD operations
- Liking videos, comments, and Community
- Dashboard functionality

Please note that you'll need to update the environment variables in Postman to match your local setup (e.g., `base_url`, `user_token`).

## License

This project is licensed under the Chai-aur-code license.
