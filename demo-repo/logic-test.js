function getUserName(user) {

    if (user) {
        return user.profile.name;
    }

    return "Guest";
}