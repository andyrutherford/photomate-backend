# Photomate Backend

A fully featured photo sharing web app, based on a popular social media platform. Built with the [MERN](https://medium.com/@digimktg/what-is-mern-stack-9c867dbad302) stack.

The frontend is available [here](https://github.com/andyrutherford/photomate-frontend).

## Features

- User authentication using JSON web tokens or OAuth through Github.
- Reset password email if you lose access to your account.
- Create a new post with a photo and caption.
- Like, and comment other users posts.
- Save posts from other users.
- View other user profiles, and their pictures in a photo grid.
- Display a blue "Verified Badge" if you verify your identity.

## Setup

To run this application, you'll need [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) (which comes with [npm](https://www.npmjs.com/)) installed on your computer. From your command line:

```sh
# Clone this repository
$ git clone

$ cd

$ npm install

# Create /config/config.env with the following variables:
$ MONGO_URI=<your-mongoDb-URI>
$ JWT_SECRET=<your-jwt-secret>
$ MONGODB_URI=<your-mongoDB-uri>
$ CLOUDINARY_URL=<your-cloudinary-url>
$ GITHUB_CLIENT_ID=<your-github-client-id>
$ GITHUB_CLIENT_SECRET=<your-github-client-secret>
$ EMAIL_SMTP=<your-email-host>
$ EMAIL_USER=<your-email-address>
$ EMAIL_PASSWORD=<your-email-address-password>
```

## Tech

Photomate uses a number of open source projects to work properly:

- [node.js](http://nodejs.org) - evented I/O for the backend
- [Express](http://expressjs.com) - fast node.js network app framework
- [mongoDB](https://www.mongodb.com/) - general purpose, document-based, distributed database
- [Cloudinary](https://cloudinary.com/) - for image storage
- [mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [axios](https://www.npmjs.com/package/axios) - Promise based HTTP client for the browser and node.js
- [multer](https://www.npmjs.com/package/multer) - node.js middleware for handling multipart/form-data
- [express validator](https://express-validator.github.io/docs/) - for data validation
- [JSON Web Token](https://jwt.io/) - for user authentication
- [NodeMailer](https://nodemailer.com/) - module for Node.js to send emails

Frontend tech is [here](https://github.com/andyrutherford/photomate-frontend#tech).

## Demo

https://photomate.netlify.app/

## License

MIT
