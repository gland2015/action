export function makeStepExec(fn) {
  let task = null;

  function toNextTask() {
    if (task) {
      if (task.next) {
        let last = task.last;
        if (last === task.next) {
          last = null;
        }
        task = task.next;
        task.last = last;
        task.exec();
      } else {
        task = null;
      }
    }
  }

  return function () {
    let args = arguments;
    if (!task) {
      let fnData = fn(...args);
      if (fnData instanceof Promise) {
        task = {};
        return fnData
          .then((r) => {
            toNextTask();
            return r;
          })
          .catch((err) => {
            toNextTask();
            throw err;
          });
      } else {
        return fnData;
      }
    } else {
      const newTask = {
        last: null,
        exec: null,
        next: null,
      };

      if (task.last) {
        task.last.next = newTask;
        task.last = newTask;
      } else if (task.next) {
        task.next.next = newTask;
        task.last = newTask;
      } else {
        task.next = newTask;
      }

      return new Promise(function (resolve, reject) {
        newTask.exec = function () {
          let fnData;
          try {
            fnData = fn(...args);
          } catch (err) {
            reject(err);
            return toNextTask();
          }

          if (fnData instanceof Promise) {
            fnData
              .then((r) => {
                resolve(r);
                toNextTask();
              })
              .catch((err) => {
                reject(err);
                toNextTask();
              });
          } else {
            resolve(fnData);
            toNextTask();
          }
        };
      });
    }
  };
}
