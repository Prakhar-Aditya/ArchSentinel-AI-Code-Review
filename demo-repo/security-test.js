function getUser(userId) {

    const query =
        `SELECT * FROM users WHERE id = ${userId}`;

    return database.query(query);
}