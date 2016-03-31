# geoffrey
Geoffrey is a company name sentiment analysis application doped with some elastic computing and some
help of the CGE.

## Installation & Set Up
Clone/fetch/pull the current version of the repository and run `npm install`.
Also grab the `.env.stormpath` file from our shared google docs folder and drop it into the project's
root folder.
That's it, run `node app` in your project run and enjoy.

## Distinction between admins and companies
The first screen is the login screen, where you also have the possibility to register and use some
other account features.
Be aware that if you register yourself with the email address that we use for our email
communication, that you are registered as an **admin** user.
With every other email address you'll be registered as a **company** user.

## Playing round with the terms API
A company user can manage the terms for that the user would like to collect twitter data and later
fire sentiment analysis on it. Currently the terms are only implement in some kind of RESTful manner
without any UI yet. Also note they are currently only stored as custom-data on the corresponding stormpath
user (Maybe we have to store them also or only in the MongoDB).

Anyway, if you would like to list the terms, add a new term, alter a term or delete a term
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
