class ApiResponse {

    constructor(stausCode,data,message="Succes") {
        this.stausCode = stausCode,
        this.data = data,
        this.message = message;
        this.success = stausCode<400;
    }
}
export {ApiResponse}