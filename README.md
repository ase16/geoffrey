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
* **Do not forget to run `node app` in the carlton project, to ensure that the term-management backend is up and running!!!**
* Finally run `node app` in your geoffrey project.

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

## Load-Test Script
```javascript
var loadtest;

function startLoadtest() {
    loadtest = setInterval(loadtestRequest, 500);
}

function loadtestRequest() {
    $.ajax({
        url: '/dev/loadtest',
        type: 'get',
        dataType: 'json',
        cache: false,
        success: function( res ) {
            console.log('Response from server = ', res);
        },
        error: function( xhr, status, errorThrown ) {
            console.log('AJAX ERROR: xhr = ', xhr);
            console.log('AJAX ERROR: status = ', status);
            console.log('AJAX ERROR: errorThrown = ', errorThrown);
        }
    });
}

function stopLoadtest() {
    clearInterval(loadtest);
}
```
