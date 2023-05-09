import firebase from '../db.js'
import fetch from "node-fetch";

const firestore = firebase.firestore()
import User from "../models/user.js";
import PageResponse from "../models/pageResponse.js";
import axios from "axios";

const {
  PORT,
  API_KEY,
  API_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
  CLIENT_ID,
  CLIENT_SECRET,
} = process.env;


export const createUser = async (req, res) => {
  try {
    const data = req.body;
    let response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          returnSecureToken: true,
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    data.role ? null : data.role = 'user'
    let responseData = await response.json()
    await firestore.collection('users').doc(`${responseData.localId}`).set({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      isGoogleAccount:false,
      role:'user',
    });
    
    res.send({
      data: data,
      ...responseData
    });
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to create the new account",
      error.message,
      Date.now()
    ));
  }
};

export const logInUser = async (req, res) => {
  
  try {
    const data = req.body;
    let response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          returnSecureToken: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    let responseData = await response.json()
    const userRef = await firestore.collection('users').doc(responseData.localId);
    const userData = await userRef.get();
    if (!userData.exists) {
      res.status(400).send(new PageResponse(
        'error',
        'empty',
        'User with the given ID not found',
        'empty',
        Date.now()
      ));
    } else {
      res.send({
        data: userData.data(),
        ...responseData
      });
    }
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to log in the requested user",
      error.message,
      Date.now()
    ));
  }
}
function parseJwt (token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}
export const uploadGoogleAccount = async (req, res) => {
  
  try {
    const tokens = await axios.post("https://oauth2.googleapis.com/token", {
      'code': req.body.code,
      'client_id': CLIENT_ID,
      'client_secret': CLIENT_SECRET,
      'redirect_uri': 'postmessage',
      'grant_type': 'authorization_code'
    });
    const data = parseJwt(tokens.data.id_token);

    let responseData
    let userResponseData
    let localId

    //search user by email in our database
    const userRef = await firestore.collection('users').where("email", "==", data.email);
    const userSnap = await userRef.get()

    let userData
    userSnap.forEach(doc => {
      userData = doc.data()
      localId = doc.id;
    });

    if(userData){
      //user already exits, so update his profile.
      userSnap.forEach(async (doc) => {
        await doc.ref.set({ ['picture']: data.picture }, { merge: true });
      });
      userResponseData=userData
    }
    else {
      //user is new to our database, get his data
      const docRef = await firestore.collection('users').doc()
      await docRef.set({
        profilePicture: data.picture,
        email: data.email,
        firstName: data.given_name,
        lastName: data.family_name,
        isGoogleAccount: true,
        role: 'user',
      })
      localId = docRef.id
      userResponseData={
        profilePicture: data.picture,
        email: data.email,
        firstName: data.given_name,
        lastName: data.family_name,
        isGoogleAccount: true,
        role: 'user',
      }
    }

    responseData = {
      kind:'googlelogin',
      localId:localId,
      refreshToken:tokens.data.refresh_token,
      idToken:tokens.data.id_token,
    }


    res.send({
      data:userResponseData,
      ...responseData
    });
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to create an account for the given google account",
      error.message,
      Date.now()
    ));
  }
}

export const refreshToken = async (req, res) => {
  try {
    let data = req.body;
    const myHeaders = {"Content-Type": "application/x-www-form-urlencoded"};
    
    let urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "refresh_token");
    urlencoded.append("refresh_token", data.refreshToken);
    let requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };
    
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, requestOptions)
      .then(response => response.text())
    
    res.send(response)
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to generate a new refresh token",
      error.message,
      Date.now()
    ));
  }
  
}

export const getUsers = async (req, res) => {
  let userArray = [];
  
  try {
    const users = await firestore.collection('users');
    const data = await users.get()
    if (data.empty) {
      res.status(404).send('No student record found');
    } else {
      data.forEach(doc => {
        const user = new User(
          doc.id,
          doc.data().firstName,
          doc.data().lastName,
          doc.data().age,
        );
        userArray.push(user);
      });
      res.send(userArray);
    }
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to retrieve the requested users data",
      error.message,
      Date.now()
    ));
  }
}

export const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await firestore.collection('users').doc(id);
    const data = await user.get();
    if (!data.exists) {
      res.status(404).send('User with the given ID not found');
    } else {
      res.send(data.data());
    }
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to retrieve the requested user data",
      error.message,
      Date.now()
    ));
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const user = await firestore.collection('users').doc(id);
    await user.update(data);
    res.send('User record updated successfully');
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to update the requested user",
      error.message,
      Date.now()
    ));
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    await firestore.collection('users').doc(id).delete();
    res.send('User deleted successfully');
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to delete the requested user",
      error.message,
      Date.now()
    ));
  }
};

export const searchUser = async (req, res) => {
  let userArray = [];
  
  try {
    const query = req.params.query
    const users = await firestore.collection('users');
    const data = await users.get()
    if (data.empty) {
      res.status(404).send('No student record found');
    } else {
      data.forEach(doc => {
        const user = {
          id: doc.id,
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          role: doc.data().role,
          email: doc.data().email
        }
        userArray.push(user);
      });
      const filteredFirstName = userArray.filter(user => user.firstName.toLowerCase().indexOf(query) !== -1)
      const filteredLastName = userArray.filter(user => user.lastName.toLowerCase().indexOf(query) !== -1)
      const filteredEmail = userArray.filter(user => user.email.toLowerCase().indexOf(query) !== -1)
      const filtered = filteredEmail.concat(filteredFirstName)
        .concat(filteredLastName)
        .filter((value, index, self) => {
          return self.indexOf(value) === index;
        })
      
      res.send(filtered);
    }
    
  } catch (error) {
    res.status(400).send(new PageResponse(
      'error',
      'empty',
      "Error while trying to search the requested user",
      error.message,
      Date.now()
    ));
  }
}

