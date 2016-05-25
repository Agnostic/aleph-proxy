# aleph-proxy
Backend for the Aleph Front-End.

This is a simple script that gets all the pull requests of an specified repository that needs to be reviewed, it will return all comments associated to the specified PR.

### Getting started

1. Create a Github application.
1. Rename `config.sample.json` to `config.json`.
2. Install dependencies with `$ npm install`.
3. The proxy runs by default on port `5000`.

### How it works?

Open the root path, it will send you to the Github autorization page, after that you will be able to do this:

http://pr-reviewer.herokuapp.com/api/pulls?user=agnostic&repo=aleph-proxy

### Notes

2. The `pulls` path will return an empty array if user don't have access to the repo.
3. All PR's need to have users tagged.

### Troubleshooting

`{ error: unauthorized }` -> You need to go to the root path to be authenticated.
