class Response {
    constructor(type,id, message, object, createdAt) {
        this.type = type;
        this.id = id;
        this.message = message;
        this.object = object;
        this.time = createdAt;
    }
}

export default Response