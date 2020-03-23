describe('lambda function', function() {
  var index = require('index');
  var context;

  beforeEach(function() {
    context = jasmine.createSpyObj('context', ['succeed', 'fail']);
    index.dynamodb = jasmine.createSpyObj('dynamo', ['scan']);
  });

  describe('popularAnswers', function(){
    it('requests problem with the given problem number', function(){
      index.popularAnswers({problemNumber: 42}, context);
      //index.(dynamodb:mock).scanがtoHaveBeenCalledWithで指定した引数で実行されたか？
      expect(index.dynamodb.scan).toHaveBeenCalledWith({
        FilterExpression: "problemId = :problemId",
        ExpressionAttributeValues: {":problemId": 42},
        TableName: 'learnjs'
      }, jasmine.any(Function));
    });

    it('groups answers by minified code', function(){
      index.popularAnswers({problemNumber: 1}, context);
      // mock objectのscanメソッド、第二引数(args[1])のコールコールバック引数を指定してscanを実行
      // https://qiita.com/sengoku/items/c4a04995aae43d953961
      index.dynamodb.scan.calls.first().args[1](undefined, {Items: [
        {answer: "true"},
        {answer: "true"},
        {answer: "true"},
        {answer: "!false"},
        {answer: "!false"},
      ]});
      expect(context.succeed).toHaveBeenCalledWith({"true":3, "!false":2});
    });
  });
});
