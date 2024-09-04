import express from "express";
import morgan from "morgan";

function configExpress(app) {
    app.use(morgan('dev'));
    app.use(express.json());
}

export default configExpress