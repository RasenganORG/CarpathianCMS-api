class User {
    constructor(id, firstName, lastName, profilePictureUrl, profilePictureName,
                isGoogleAccount, email, role, specialPermissions, phone ) {
        this.id = id;
        this.firstName = firstName;
        this.email = email;
        this.lastName = lastName;
        this.profilePictureUrl = profilePictureUrl;
        this.profilePictureName = profilePictureName;
        this.role = role;
        this.specialPermissions = specialPermissions;
        this.isGoogleAccount = isGoogleAccount;
        this.phone = phone;
    }
}

export default User