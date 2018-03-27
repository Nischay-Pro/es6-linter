module.exports = (robot) => {
  robot.on('pull_request.opened', receive);
  async function receive(context) {
    // Get all issues for repo with user as creator
    const response = await context.github.issues.getForRepo(context.repo({
      state: 'all',
      creator: context.payload.pull_request.user.login
    }));
    const countPR = response.data.filter(data => data.pull_request);
    try {
      let repo = context.repo();
      const files = await context.github.pullRequests.getFiles(context.issue());
      let profn = []
      files.data.map(element => {
        profn.push(downloadFile(context, element));
      });
      let bodyresults = []
      Promise.all(profn).then((file) => {
        file.map(element => {
          bodyresults.push(createCommentFromFile(file));
        });
        context.github.issues.createComment(context.issue({
          body: "Test"
        }));
        console.log(bodyresults);
      }).catch((err) => {
        console.log(err)
      });
    } catch (err) {
      if (err.code !== 404) {
        throw err;
      }
    }
  }
};

module.exports = (robot) => {
  robot.on('pull_request.reopened', receive);

  async function receive(context) {
    // Get all issues for repo with user as creator
    const response = await context.github.issues.getForRepo(context.repo({
      state: 'all',
      creator: context.payload.pull_request.user.login
    }));

    const countPR = response.data.filter(data => data.pull_request);
    try {

      let repo = context.repo();
      const files = await context.github.pullRequests.getFiles(context.issue());
      let profn = []

      console.log(files);
      files.data.map(element => {
        profn.push(downloadFile(context, element));
      });

      let bodyresults = []
      Promise.all(profn).then((file) => {
        file.map(element => {
          bodyresults.push(createCommentFromFile(file));
        });
        context.github.issues.createComment(context.issue({
          body: "Test"
        }));
        console.log(bodyresults);
      }).catch((err) => {
        console.log(err)
      });
    } catch (err) {
      if (err.code !== 404) {
        throw err;
      }
    }
  }
};

async function downloadFile(context, element) {
  return new Promise((resolve, reject) => {
    try {
      let dir = element.filename.substr(0, element.filename.lastIndexOf("/"));
      let file = {
        name: path.basename(element.filename),
        path: dir,
        url: element.raw_url
      }
      mkdirp.sync(file.path);
      let makefile = fs.createWriteStream(path.join('tmp', context.repo().owner, context.repo().repo, file.path, file.name));
      let request = https.get(file.url, function (response) {
        response.pipe(makefile);
      });
      makefile.on('finish', () => {
        resolve(file);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const createCommentFromFile = (file, repo) => {
  const filename = path.join('tmp', repo().owner, repo().repo, file.path, file.name);
  const {
    exec
  } = require('child_process');
  exec(`eslint --no-eslintrc --parser-options=ecmaVersion:6 "${filename}"`, (err, stdout, stderr) => {
    if (err) {
      return;
    }
    const response = {
      title: file.name,
      result: stdout
    }
    return response;
  });
};