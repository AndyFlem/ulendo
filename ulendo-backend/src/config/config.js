const config = {
    port: 4001,
    cors_origin: ['http://localhost:4000','http://pages.ulendo.com','https://pages.ulendo.com'],
    development_mode: true,
    api_version: 'v1',
    auth_secret: 'kjsllwjkdal!kdkd_dks44AkfkA',
    auth_expiry: 24*60*60,
    db:{database: 'ulendo',user: 'ulendo',password: 'extramild20'},
}

module.exports = config