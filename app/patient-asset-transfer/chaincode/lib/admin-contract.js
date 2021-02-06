/**
 * @author Varsha Kamath
 * @email varsha.kamath@stud.fra-uas.de
 * @create date 2021-01-23 21:50:38
 * @modify date 2021-01-26 13:30:00
 * @desc [Admin Smartcontract to create, read patient details in legder]
 */
/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let Patient = require('./Patient.js');
const PrimaryContract = require('./primary-contract.js');

class AdminContract extends PrimaryContract {

    //Returns the last patientId in the set
    async getLatestPatientId(ctx) {
        let allResults = await this.queryAllPatients(ctx);
        let data = JSON.parse(allResults);
        let lastPatientId = data[data.length - 1].Key;
        return lastPatientId;
    }

    //Create patient in the ledger
    async createPatient(ctx, args) {
        args = JSON.parse(args);

        if (args.password === null || args.password === '') {
            throw new Error(`Empty or null values should not be passed for password parameter`);
        }

        // Generally we create patient id by ourself so if patient id is not present in the request then fetch last id
        // from ledger and increment it by one. Since we follow patient id pattern as "PID0", "PID1", ...
        // 'slice' method omits first three letters and take number
        if (args.patientId === null || args.patientId === '') {
             const lastId = this.getLatestPatientId(ctx).slice(3);
            args.patientId = 'PID' + parseInt(lastId) + 1;
        }

        let newPatient = await new Patient(args.patientId, args.firstName, args.lastName, args.password, args.age,
            args.phoneNumber, args.emergPhoneNumber, args.address, args.bloodGroup, args.changedBy, args.allergies);
        const exists = await this.patientExists(ctx, newPatient.patientId);
        if (exists) {
            throw new Error(`The patient ${newPatient.patientId} already exists`);
        }
        const buffer = Buffer.from(JSON.stringify(newPatient));
        await ctx.stub.putState(newPatient.patientId, buffer);
    }

    //Read patient details based on patientId
    async readPatient(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        const buffer = await ctx.stub.getState(patientId);
        let asset = JSON.parse(buffer.toString());
        asset = ({
            patientId: patientId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            phoneNumber: asset.phoneNumber,
            emergPhoneNumber: asset.emergPhoneNumber
        });
        return asset;
    }

    //Read patients based on lastname
    async queryPatientsByLastName(ctx, lastName) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'patient';
        queryString.selector.lastName = lastName;
        const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        let asset = JSON.parse(buffer.toString());

        return this.fetchLimitedFields(asset);
    }

    //Read patients based on firstName
    async queryPatientsByFirstName(ctx, firstName) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'patient';
        queryString.selector.firstName = firstName;
        const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        let asset = JSON.parse(buffer.toString());

        return this.fetchLimitedFields(asset);
    }

    //Retrieves all patients details
    async queryAllPatients(ctx) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator, false);

        return this.fetchLimitedFields(asset);
    }

    fetchLimitedFields = asset => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                patientId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                phoneNumber: obj.Record.phoneNumber,
                emergPhoneNumber: obj.Record.emergPhoneNumber
            };
        }

        return asset;
    }
}
module.exports = AdminContract;