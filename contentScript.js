console.log('edi monitoring extentions init');
class ClassWatcher {

   constructor(targetNode, classToWatch, classAddedCallback, classRemovedCallback) {
       this.targetNode = targetNode
       this.classToWatch = classToWatch
       this.classAddedCallback = classAddedCallback
       this.classRemovedCallback = classRemovedCallback
       this.observer = null
       this.lastClassState = targetNode.classList.contains(this.classToWatch)

       this.init()
   }

   init() {
       this.observer = new MutationObserver(this.mutationCallback)
       this.observe()
   }

   observe() {
       this.observer.observe(this.targetNode, { attributes: true })
   }

   disconnect() {
       this.observer.disconnect()
   }

   mutationCallback = mutationsList => {
       for(let mutation of mutationsList) {
           if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
               let currentClassState = mutation.target.classList.contains(this.classToWatch);
               if(this.lastClassState !== currentClassState) {
                   this.lastClassState = currentClassState;
                   if(currentClassState) {
                       this.classAddedCallback();
                   }
                   else {
                       this.classRemovedCallback();
                   }
               }
           }
       }
   }
}

function workOnClassAdd() {
   console.log("load state added");
}

function workOnClassRemoval() {
   console.log("load state ended");
   queryScript();
}


queryScript();

//проверка по header-у (фикс возвратов)
setInterval(() => {
   if (!document.querySelector('#message-monitoring-table-header tr th')) return;
   if (document.querySelector('#message-monitoring-table-header tr th').innerText != 'Поставщик') {
      queryScript();
   } else {
      return;
   }
}, 100);


function queryScript() {
   //проверка на существование тела (первая загрузка)
   let isTableExist = false;
   let contentTable = document.querySelectorAll('table tbody')[1];
   if (!contentTable) {
      setTimeout(() => {
         queryScript();
      }, 100);
      return;
   }

   //table header offset
   if (document.querySelector('#message-monitoring-table-header tr th') && document.querySelector('#message-monitoring-table-header tr th').innerText != 'Поставщик') {
      let th = document.createElement('th');
      th.innerText = 'Поставщик';
      document.querySelector('#message-monitoring-table-header tr').insertAdjacentElement('afterbegin', th);
   }

   // watch for a specific class change
   let classWatcher = new ClassWatcher(contentTable, 'loading', workOnClassAdd, workOnClassRemoval)

   let rowCollection = contentTable.querySelectorAll('tr');

   rowCollection.forEach(row => {
      if (row.querySelector('.ext-button')) return; //double fix
      let td = document.createElement('td');
      if (!row.querySelector('td a').getAttribute('href')) return;
      let docId = row.querySelector('td a').getAttribute('href').split('/');
      docId = docId[docId.length - 1];

      let button = document.createElement('a');
      button.setAttribute('data-ext-doc-id', docId);
      button.innerText = 'Поставщик';
      //type="button" class="_3ICa5rmHWJzYEfRRG2wrUN f8sC_jmf4Z2WdSVA9kF7m _2lPAIEmpHyhLImZND3S6wK" tabindex="0" style="border-radius: 1px;"
      button.className = 'ext-button';

      td.style = 'padding-left: 1px;';
      let buttonWrapper = document.createElement('div');
      buttonWrapper.style = 'display: flex; align-items: center; height: 100%;';
      buttonWrapper.append(button);
      td.append(buttonWrapper);
      row.insertAdjacentElement('afterbegin', td);
      var xhr = new XMLHttpRequest();
      xhr.open("GET", `https://edi.kontur.ru/internal-api/message-monitoring-2/card/new/${docId}`, true);
      //success path
      xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
      xhr.onreadystatechange = function () {
         if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            let jsonResponse;
            try {
               jsonResponse = JSON.parse(xhr.responseText);
               button.setAttribute('href', `https://edi.kontur.ru/${jsonResponse.supplierInterfaceReference.partyId}/Supplier/${jsonResponse.documentType.documentType}?id=${jsonResponse.supplierInterfaceReference.objectId}`);
            } catch(e) {
               return false;
            }
         }
      }
      xhr.send(xhr);
   });

}