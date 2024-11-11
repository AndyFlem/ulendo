import { reactive } from 'vue'

export default {

  install: (app) => {
    let _user = reactive({
      user_id: null,
      email: null,
      first_name: null,
      last_name: null,
      organisation: null
    })

    if (localStorage.user) {
      const u = JSON.parse(localStorage.user)
      _user.user_id = u.user_id
      _user.email = u.email
      _user.first_name = u.first_name
      _user.last_name = u.last_name
      _user.organisation = u.organisation
    }
    app.provide('user', _user)

    const signout = () => {
      delete localStorage.csrf
      delete localStorage.user
      _user.user_id = null
    }
    app.provide('signout', signout)

    const signin = (username, password) => {
      return app.axios.http.post('/signin', { email: username, password: password })
        .then(response => {
          if (!response.data.csrf) {
            delete localStorage.csrf
            delete localStorage.user
            throw new Error('Login failed')
          }
          localStorage.csrf = response.data.csrf
          return app.axios.http.get('/current-user')
        })
        .then(response => {
          const u = response.data
          _user.user_id = u.user_id
          _user.email = u.email
          _user.first_name = u.first_name
          _user.last_name = u.last_name
          _user.organisation = u.organisation

          localStorage.user = JSON.stringify(_user)
          return _user
        })
        .catch(error => {
          delete localStorage.csrf
          delete localStorage.user
          throw error
        })
    }
    app.provide('signin', signin)

    const getGroups = () => {
      return app.axios.http.get('/usergroups/' + _user.user_id)
        .then(response => {
          return response.data.map(v=>v.usergroup_ref)
        })
    }
    app.provide('getGroups', getGroups)
  }
}
