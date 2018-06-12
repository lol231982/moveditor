'use strict';

/**
 * @ngdoc service
 * @name moveditorApp.mvNav
 * @description
 * # mvNav
 * Service in the moveditorApp.
 */
angular.module('moveditorApp')
    .service('ContentService', [
        'MvHelperService',
        function (MvHelperService) {
            this.contentList = {};
            this.contentUrlList = [];

            this.addContentObjectToList = function (contentMaterialObject) {
                if (this.contentUrlList.indexOf(contentMaterialObject.url) == -1) {
                    var contentIndexHash = MvHelperService.generateRandomHash();
                    this.contentList[contentIndexHash] = contentMaterialObject;
                    this.contentUrlList.push(contentMaterialObject.url);
                }
                else {
                    console.log('object already added');
                }
            };

            this.removecontentObjectFromList = function (contetnMaterialIndex) {
                if (angular.isDefined(this.contentList[contetnMaterialIndex])) {
                    var contentUrlListIndex = this.contentUrlList.indexOf(this.contentList[contetnMaterialIndex].url);
                    this.contentUrlList.splice(contentUrlListIndex, 1);
                    delete this.contentList[contetnMaterialIndex];
                }
                else {
                    console.log('element not in content list');
                }
            };

            this.setLengthOfContentListObject = function (contetnMaterialIndex, length) {
                if(angular.isDefined(this.contentList[contetnMaterialIndex])) {
                    this.contentList[contetnMaterialIndex].length = length;
                    console.log(this.contentList[contetnMaterialIndex]);
                }
            };

            this.getContentList = function () {
                return this.contentList;
            };

            this.getContentUrlList = function () {
                return this.contentUrlList;
            };

            // ToDo: check functionality and correctness
            this.addMpdForContentObject = function (contetnMaterialIndex, mpd) {
                this.contentList[contetnMaterialIndex].setMdp(mpd);
            };
        }]);
