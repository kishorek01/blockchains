/**
 * @author Varsha Kamath
 * @email varsha.kamath@stud.fra-uas.de
 * @create date 2020-12-14 21:50:38
 * @modify date 2021-01-07 15:30:00
 * @desc [Smartcontract to create, read, update and delete patient details in legder]
 */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
let Patient = require('./Patient.js');

class PatientContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const patient = [{
                firstName: 'Monica',
                lastName: 'Latte',
                age: '50',
                phoneNumber: '+4912345678',
                emergPhoneNumber: '+4912345678',
                address: 'Albrechtstrasse 71, 86383 Stadtbergen',
                bloodGroup: 'O+',
                allergies: 'No',
                symptoms: 'Cholesterol, Total 250 mg/dl',
                diagnosis: 'High Cholesterol',
                treatment: 'Vasolip 10 mg everyday',
                followUp: '6 Months',
            },
            {
                firstName: 'Max',
                lastName: 'Mustermann',
                age: '60',
                phoneNumber: '+491764561111',
                emergPhoneNumber: '+491764561113',
                address: 'Mainzer landstrasse 134, 60326 Frankfurt am Main',
                bloodGroup: 'B+',
                allergies: 'No',
                symptoms: 'Heart Burn, shortness of breath, Acidity',
                diagnosis: 'Esophagitis',
                treatment: 'omeprazole 40 mg for 10 days before food',
                followUp: '2 Weeks',
            },
            {
                firstName: 'Johannes',
                lastName: 'Schmidt',
                age: '63',
                phoneNumber: '+491764561111',
                emergPhoneNumber: '+491764561113',
                address: 'Genslerstraße 19, 60326 Berlin',
                bloodGroup: 'B+',
                allergies: 'No',
                symptoms: 'Dizziness, Nausea, systolic-150, diastolic-110',
                diagnosis: 'Hypertension',
                treatment: 'CORBIS 5 mg one per day',
                followUp: '2 Weeks',
            },
            {
                firstName: 'Torben',
                lastName: 'Klaproth',
                age: '75',
                phoneNumber: '+491764561111',
                emergPhoneNumber: '+491764561113',
                address: 'Genslerstraße 19, 60326 Berlin',
                bloodGroup: 'B+',
                allergies: 'No',
                symptoms: 'Weight Loss, frequent urination, dizziness',
                diagnosis: 'Diabetes Mellitus',
                treatment: 'PRINIVIL TABS 20 MG (LISINOPRIL), HUMULIN INJ 70/30 20 units after breakfast',
                followUp: '4 Weeks',
            },
            {
                firstName: 'Lisa',
                lastName: 'Eckel',
                age: '78',
                phoneNumber: '+491764561179',
                emergPhoneNumber: '+491764567913',
                address: 'Genslerstraße 19, 60326 Berlin',
                bloodGroup: 'B+',
                allergies: 'No',
                symptoms: 'Pain in the knee joints',
                diagnosis: 'Osteoarthritis',
                treatment: 'ULTRADAY 40 mg twice per day',
                followUp: '2 Weeks',
            },
            {
                firstName: 'Harry',
                lastName: 'Schumann',
                age: '72',
                phoneNumber: '+491764561156',
                emergPhoneNumber: '+491764589113',
                address: 'Pappelallee 8, 98631 Behrungen',
                bloodGroup: 'AB+',
                allergies: 'No',
                symptoms: 'Pain in the shoulder and difficulty in shoulder movement ',
                diagnosis: 'Periarthritis',
                treatment: 'Hydrocortisone 20 ml injection',
                followUp: '4 Weeks',
            },
        ];

        for (let i = 0; i < patient.length; i++) {
            patient[i].docType = 'patient';
            await ctx.stub.putState('PID' + i, Buffer.from(JSON.stringify(patient[i])));
            console.info('Added <--> ', patient[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async patientExists(ctx, patientId) {
        const buffer = await ctx.stub.getState(patientId);
        return (!!buffer && buffer.length > 0);
    }

    async readPatient(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        const buffer = await ctx.stub.getState(patientId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    //This function is to update patient personal details. This function should be called by patient.
    async updatePatientPersonalDetails(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let newPhoneNumber = args.newPhoneNumber;
        let newEmergPhoneNumber = args.newEmergPhoneNumber;
        let newAddress = args.newAddress;
        let newAllergies = args.newAllergies;

        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        const patient = await this.readPatient(ctx, patientId)
        if (newPhoneNumber !== null && newPhoneNumber !== '')
            patient.phoneNumber = newPhoneNumber;

        if (newEmergPhoneNumber !== null && newEmergPhoneNumber !== '')
            patient.emergPhoneNumber = newEmergPhoneNumber;

        if (newAddress !== null && newAddress !== '')
            patient.address = newAddress;

        if (newAllergies !== null && newAllergies !== '')
            patient.allergies = newAllergies;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    }

    //Retrieves patient medical history based on patientId
    async getPatientHistory(ctx, patientId) {
        let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let results = await this.getAllPatientResults(resultsIterator, true);
        console.info('results <--> ', results);
        return JSON.stringify(results);
    }

    async getAllPatientResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                    jsonRes.Timestamp = res.value.timestamp;
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }
}
module.exports = PatientContract;