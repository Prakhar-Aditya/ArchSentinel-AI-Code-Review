function findDuplicateUsers(users) {

    const duplicates = [];

    for (let i = 0; i < users.length; i++) {

        for (let j = i + 1; j < users.length; j++) {

            if (users[i].email === users[j].email) {
                duplicates.push(users[i]);
            }

        }
    }

    return duplicates;
}