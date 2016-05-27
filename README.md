# geoffrey
Geoffrey is a company name sentiment analysis application doped with some elastic computing by making
use of several google cloud platform services. The application consists of several independent
microservices/components, each residing in its own repository. Geoffrey is also the name of one of
these components. It is the "nearest" one to the users of the application, directly receiving the http
requests of them. All in all we have the following components that are mirrored to instance groups of 
the GCE.

* **Geoffrey:** Delivering Front-End sites, diagrams etc.
* **Carlton:** REST-API to take over some functionality, so that the geoffrey-nodes do not need to serve everything
* **Jazz:** Independently fetches tweets from twitter of registered terms and assigns them to available will-nodes
* **Will:** Each will-node fetches only tweets that are assigned to him (in 500 batch sizes due to restriction by google cloud datastore) and processes sentiment analysis over them and writes the results to the datastore
* **Phil:** Custom autoscaler for the will-nodes. A bit simplified: Depending whether they fetch 500 tweets per batch process in average, phil will increase the will-nodes instance-group

## Deployment Instructions
If not specified differently, use the default values.

### 1) Creating instance templates

Navigate in the google cloud platform console to *Compute Engine* > *Instance Templates*. For each of the 5 components do the following:

1. Click on **CREATE INSTANCE TEMPLATE**
2. **Name** > Name it e.g. *"geoffrey-template"*
3. **Machine type** > Take the standard one *"1 vCPU"* (1 CPU, 3.75 GB). But e.g. for the *phil-template* a smaller one is also sufficient, e.g. *"small"*.
4. **Boot Disk** > Also standard value *"Debian GNU/Linux 8 (jessie)"* (10 GB)
5. **Identity and API access** > *Service Account* = *"Compute Engine default service account"*, *Access scopes* = *"Allow full access to all Cloud APIs"*
6. **Firewall** > Only for *"geoffrey-template"* and *"carlton-template"* make a tick for *"Allow HTTP traffic"*
7. Extend options by clicking on **Management, disk, networking, SSH keys**
8. **Startup script** > Depending on the template you create currently, copy paste the corresponding line
```bash
curl https://raw.githubusercontent.com/ase16/setup-scripts/master/geoffrey/gcloud-startup-script.sh | bash -
curl https://raw.githubusercontent.com/ase16/setup-scripts/master/carlton/gcloud-startup-script.sh | bash -
curl https://raw.githubusercontent.com/ase16/setup-scripts/master/jazz/gcloud-startup-script.sh | bash -
curl https://raw.githubusercontent.com/ase16/setup-scripts/master/will/gcloud-startup-script.sh | bash -
curl https://raw.githubusercontent.com/ase16/setup-scripts/master/phil/gcloud-startup-script.sh | bash -
```

### 2) Creating instance groups

Navigate in the google cloud platform console to *Compute Engine* > *Instance groups*. For each of the 5 components do the following:

1. Click on **CREATE INSTANCE GROUP**
2. **Name** > Name it according to the component followed by "-nodes", e.g. for Geoffrey write for Name = *"geoffrey-nodes"*
3. **Zone** > If you only have a free trial account, you must ensure that you choose for each instance group a different region (except phil and jazz, they can be on the same), e.g. as follows:
```
geoffrey-nodes = europe-west1-d
carlton-nodes = us-east1-d
jazz-nodes = us-central1-a
will-nodes = asia-east1-a
phil-nodes = us-central1-a
```
   **REALLY IMPORTANT: Choose real different regions, not just "europe-west1-d", "europe-west1-c", "europe-west1-b" etc. for the different components**
4. **Instance template** > Choose the appropriate instance template for the current instance group you create.
5. **Autoscaling** > Only *"geoffrey-nodes"* and *"carlton-nodes"* make use of google predefined auto-scalers. For both of them choose for *Autoscale based on* *"CPU usage"* and as Maximum number of instances choose 8


### 3) Configure Load-Balancer for **geoffrey-nodes**

Navigate in the google cloud platform console to *Networking* > *Load balancing*.

1. Click on **CREATE LOAD BALANCER**
2. Click on **Start configuration** for *"TCP Load Balancing"* in the middle
3. **Name** > Name it e.g. *"geoffrey-load-balancer"*
4. Click on **Backend configuration**
5. **Region** > Select the appropriate region that you choose for the geoffrey-nodes, e.g. *"europe-west1-d"*
6. **Backends** > Select existing instance groups > Add an instance group > choose *"geoffrey-nodes"*
7. Click on **Frontend configuration**
8. **IP** > Click on dropdown of **IP**, choose **Create IP address** 
9. **Port** > choose port *"3000"*
10. Click on **Create**


### 4) Configure Load-Balancer for **carlton-nodes**

Navigate in the google cloud platform console to *Networking* > *Load balancing*.

1. Click on **CREATE LOAD BALANCER**
2. Click on **Start configuration** for *"TCP Load Balancing"* in the middle
3. **Name** > Name it e.g. *"carlton-load-balancer"*
4. Click on **Backend configuration**
5. **Region** > Select the appropriate region that you choose for the geoffrey-nodes, e.g. *"us-east1-d"*
6. **Backends** > Select existing instance groups > Add an instance group > choose *"carlton-nodes"*
7. Click on **Frontend configuration**
8. **IP** > Click on dropdown of **IP**, choose **Create IP address** 
9. **Port** > choose port *"3001"*
10. Click on **Create**


### 5) Create Firewall Rules

Navigate in the google cloud platform console to *Networking* > *Firewall rules*.

1. Click on **CREATE FIREWALL RULE**
2. **Name** > Choose an appropriate name, e.g. "geoffrey-firewall-rules"
3. **Source filter** > Choose from dropdown *"Allow from any source (0.0.0.0./0)"*
4. **Allowed protocols and ports** > Type in "tcp:3000-3001; udp:3000-3001"
5. Click on **Save**


### 6) Preparing Metadata

Navigate in the google cloud platform console to *Compute Engine* > *Metadata*. Click *"Add item"* for each of the following 6 keys.

**geoffrey-config-production**

* For **proxy.carlton** makes sure you use the ip that was created for the **carlton-load-balancer**

```json
{
    "gcloud": {
        "projectId": "ase16-1255"
    },

    "log": {
        "level": "info"
    },

    "proxy": {
        "carlton": "http://123.123.123.123:3001"
    },

    "stats": {
        "jazzStatsPerRequest": 500,
        "willStatsPerRequest": 500
    },

    "admin-emails": [
        "andreas.albrecht@uzh.ch",
        "oliver.leumann@gmail.com",
        "roy.rutishauser@gmail.com",
        "shanmathuran.sritharan@uzh.ch"
    ]
}
```

**carlton-config-production**
```json
{
    "gcloud": {
        "projectId": "ase16-1255"
    },

    "log": {
        "level": "info"
    }
}
```

**jazz-config-production**

* For **twitter** use your corresponding twitter credentials from your twitter-account
* For **will.instanceGroupZone** provide the correct zone, e.g. *"asia-east1-a"*

```json
{
    "twitter": {
        "consumer_key": "",
        "consumer_secret": "",
        "access_token": "",
        "access_token_secret": ""
    },

    "gcloud": {
        "projectId": "ase16-1255"
    },

    "jazz": {
        "termUpdateInterval": 30,
        "reassignLostTweetsInterval": 60
    },

    "will": {
        "instanceGroupName": "will-nodes",
        "instanceGroupZone": "asia-east1-a"
    },

    "loadBalancer": {
        "listOfVmsUpdateInterval": 10
    },

    "stats": {
        "updateInterval": 5
    },

    "log": {
        "level": "info"
    }
}
```

**will-config-production**
```json
{
    "gcloud": {
        "projectId": "ase16-1255"
    },

    "batchProcessing": {
        "initiallyPaused": false,
        "backOffDurationWhenPaused": 10,
        "readTermsInterval": 30,
        "saveAnalysisInterval": 30,
        "readPausedStateInterval": 10,
        "backOffDurationWhenEmpty": 10,
        "logStatsInterval": 28
    },

    "log": {
        "level": "info"
    }
}
```


**phil-config-production**

* For **will.instanceGroupZone** provide the correct zone, e.g. *"asia-east1-a"*

```json
{
    "gcloud": {
        "projectId": "ase16-1255"
    },

    "will": {
        "instanceGroupName": "will-nodes",
        "instanceGroupZone": "asia-east1-a"
    },

    "autoscale": {
        "minimumNumberOfInstances": 1,
        "maximumNumberOfInstances": 6,
        "lowerBoundUsage": 0.3,
        "upperBoundUsage": 0.9,
        "loadCheckInterval": 30
    },

    "log": {
        "level": "info"
    }
}
```


**env-stormpath**

```
Copy paste the content of the stormpath-credentials.txt you got via mail here
```



## Distinction between admins and companies
The first screen is the login screen, where you also have the possibility to register and use some
other account features.
Be aware that if you register yourself with the email address that we use for our email
communication, that you are registered as an **admin** user.
With every other email address you'll be registered as a **company** user.

## Navigation Structure of the app
* NotLoggedIn
    - `/` Login screen
    - `/register` Register screen
* Logged in as company user
    - `/company/main` Some welcome/starting/overview screen for the company user
    - `/company/term-management` Screen to list, create and delete terms
    - `/company/viz` Screen to visualize sentiment analysis of multiple terms
* Logged in as admin user
    - `/admin/main` Some welcome/starting/overview screen for the admin user
    - `/admin/monitoring/geoffrey` Screen to give info about the instance group *"geoffrey-nodes"*
    - `/admin/monitoring/carlton` Screen to give info about the instance group *"carlton-nodes"*
    - `/admin/monitoring/jazz` Screen to give info about the instance group *"jazz-nodes"*
    - `/admin/monitoring/will` Screen to give info about the instance group *"will-nodes"*


## Local Installation & Set Up (a bit outdated)
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