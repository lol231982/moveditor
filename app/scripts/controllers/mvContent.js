'use strict';

/**
 * @ngdoc function
 * @name moveditorApp.controller:MvContentCtrl
 * @description
 * # MvContentCtrl
 * Controller of the moveditorApp
 */
angular.module('moveditorApp')
    .controller('MvContentCtrl', [
        'ContentService',
        'TimelineService',
        'MvHelperService',
        'AWSService',
        function (ContentService, TimelineService, MvHelperService, AWSService) {

            var self = this;

            // ============================================================================
            // add content material
            // ============================================================================

            this.addContentMaterial = function (MaterialURL) {
                ContentService.addContentObjectToList("", MvHelperService.getURLMediaType(MaterialURL), 0, MaterialURL, null);
            };

            // ============================================================================
            // save session, modified from http://simey.me/saving-loading-files-with-javascript/
            // ============================================================================

            this.saveContentMaterial = function () {
                console.log("save session");

                // object we want to save
                var objectToSave = {contentArea: ContentService.getContentList(), timelineArea: TimelineService.getTimelineList()};
                // convert to json string
                var JSONToSave = angular.toJson(objectToSave);
                // create a link DOM fragment
                var tmpLink = $("<a/>");

                // <a download="video_stitching_session.txt" href='data:application/octet-stream,...'></a>
                tmpLink
                  .attr("download", "video_stitching_session.txt")
                  .attr("href", "data:application/octet-stream," + JSONToSave)
                  .appendTo("body")
                  .get(0)
                  .click();
            };

            // ============================================================================
            // SQS segmentation and stitching requests
            // ============================================================================

            this.sendStitching = function () {

                console.log('send stitching');

                var contentList = ContentService.getContentList();
                var timelineList = TimelineService.getTimelineList();

                // for(var i = 0; i < timelineList['video'].length; i++) {
                //     AWSService.requestSegmentation(timelineList['video'][i]);
                // }

                AWSService.requestSegmentation(0);

                // AWSService.receiveSqs();
            };

            this.receive = function () {
                AWSService.receive10();
            };
        }
    ]);
