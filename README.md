# geoffrey
Geoffrey is a company name sentiment analysis application doped with some elastic computing and some
help of the CGE.

## Installation & Set Up
* Clone/fetch/pull the current version of the repository and run `npm install`.
* Grab the `.env.stormpath` file from our shared google docs folder and drop it into the project's
root folder.
* Grab the `.env.cge` file from our shared google docs folder and drop it into the project's
root folder.
* Grab the `ASE16-************.json` file from our shared google docs folder and drop it into config folder.
* Check if your `development.json` is properly set up (compare it to the one in our google docs folder).
* Make sure you have mongo running on your machinge, e.g. with a statment like `mongod --dbpath="path/to/data/directory"`
* That's it, run `node app` in your project run and enjoy.

## Distinction between admins and companies
The first screen is the login screen, where you also have the possibility to register and use some
other account features.
Be aware that if you register yourself with the email address that we use for our email
communication, that you are registered as an **admin** user.
With every other email address you'll be registered as a **company** user.

## Visible navigation Structure of the app
* NotLoggedIn
    - `/` Login screen
    - `/register` Register screen
* Logged in as company user
    - `/company/main` Some welcome/starting/overview screen for the company user
    - `/company/term-management` Screen to list, create and delete terms
    - `/company/viz` Screen to visualize sentiment analysis of multiple terms
* Logged in as admin user
    - `/admin/main` Some welcome/starting/overview screen for the admin user
    - `/admin/vm-management` Screen to list, create and delete vms
    - `/admin/fetcherlog` Screen to visualize sentiment analysis of multiple terms

## Terms Management in optimistic UI
A first implmentation has been made of the terms management UI (without CSS, just HMTL & JS).
An "Optimistic UI" approach has been used, which might be known from MeteorJS.
So, if you add a new term, you immediately see it on the list, even though it hasn't
been really stored on Stormpath and the DB yet. For you to see what's going on, I've
artificially added a string "(Optimistic UI)" after the term when you add it. After
the client got a response from server, the (Optimistic UI) disappears.

## Playing round with the terms API
A company user can manage the terms for that the user would like to collect twitter data and later
fire sentiment analysis on it.

The terms are implemented in some kind of RESTful manner.
Note they are currently only stored as custom-data on the corresponding stormpath
user (Maybe we have to store them also or only in the MongoDB).

Anyway, if you would like to use the terms API to list the terms, add a new term, alter a term or delete a term
then you can currently **use the web-browser's console** to fire some ajax requests (I've set up jQuery
on the front-end so that we can use that). Be ware that parameter and error handling is rather poor
yet and will be improved in the near future.

### Create a new term
```javascript
$.ajax({
	url: '/company/terms',
	type: 'post',
	data: { 'term': 'BatmanVSSuperman' },
	dataType: 'json',
	cache: false,
	success: function( res ) {
		console.log('Response from server = ', res);
	}
});
```

### List the terms
```javascript
$.ajax({
	url: '/company/terms',
	type: 'get',
	dataType: 'json',
	cache: false,
	success: function( res ) {
		console.log('Response from server = ', res);
	}
});
```

### Update a term
```javascript
$.ajax({
	url: '/company/terms/BatmanVSSuperman',
	type: 'put',
	data: { 'newTerm': 'IronMan' },
	dataType: 'json',
	cache: false,
	success: function( res ) {
		console.log('Response from server = ', res);
	}
});
```

### Delete a term
```javascript
$.ajax({
	url: '/company/terms/IronMan',
	type: 'delete',
	dataType: 'json',
	cache: false,
	success: function( res ) {
		console.log('Response from server = ', res);
	}
});
```
